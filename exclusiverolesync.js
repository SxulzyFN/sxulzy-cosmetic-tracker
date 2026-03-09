// utils/exclusiveRoleSync.js

const axios = require("axios");
const { EXCLUSIVES_LIST } = require("./exclusiveslist");

const FORTNITE_API_TTL = 6 * 60 * 60 * 1000;

let cachedAt = 0;
let cosmeticsById = null;
let cosmeticsByName = null;

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function safeRoleName(value) {
  return String(value || "Exclusive")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

async function loadCosmeticIndex() {
  const now = Date.now();

  if (cosmeticsById && cosmeticsByName && (now - cachedAt) < FORTNITE_API_TTL) {
    return { cosmeticsById, cosmeticsByName };
  }

  const res = await axios.get("https://fortnite-api.com/v2/cosmetics/br", {
    timeout: 30000,
  });

  const data = Array.isArray(res.data?.data) ? res.data.data : [];

  cosmeticsById = new Map();
  cosmeticsByName = new Map();

  for (const cosmetic of data) {
    const id = normalize(cosmetic?.id);
    const name = normalize(cosmetic?.name);

    if (id) cosmeticsById.set(id, cosmetic);
    if (name) cosmeticsByName.set(name, cosmetic);
  }

  cachedAt = now;
  return { cosmeticsById, cosmeticsByName };
}

async function resolveCosmeticId(entry) {
  const directId = normalize(entry?.cosmetic?.id);
  if (directId) return directId;

  const name = normalize(entry?.cosmetic?.name);
  if (!name) return null;

  const { cosmeticsByName } = await loadCosmeticIndex();
  const match = cosmeticsByName.get(name);

  return match?.id ? normalize(match.id) : null;
}

function entryRoleLabel(entry) {
  if (entry?.kind === "bundle") {
    return safeRoleName(entry?.roleLabel || entry?.label || "Bundle");
  }

  if (entry?.label) return safeRoleName(entry.label);

  const cosmeticName =
    entry?.cosmetic?.name ||
    entry?.cosmetic?.id ||
    "Unknown Cosmetic";

  if (entry?.kind === "style" && entry?.styleName) {
    return safeRoleName(`${cosmeticName} | ${entry.styleName}`);
  }

  return safeRoleName(cosmeticName);
}

function entryRareLabel(entry) {
  if (entry?.kind === "bundle") {
    return String(entry?.label || entry?.roleLabel || "Bundle");
  }

  if (entry?.label) return String(entry.label);

  const cosmeticName =
    entry?.cosmetic?.name ||
    entry?.cosmetic?.id ||
    "Unknown Cosmetic";

  if (entry?.kind === "style" && entry?.styleName) {
    return `${cosmeticName} | ${entry.styleName}`;
  }

  return cosmeticName;
}

function collectSnapshotStrings(snapshotCosmetic) {
  const out = new Set();

  const variants = snapshotCosmetic?.variants || {};
  const active = snapshotCosmetic?.active || {};
  const rawVariants = Array.isArray(snapshotCosmetic?.rawVariants)
    ? snapshotCosmetic.rawVariants
    : [];

  for (const [channel, tags] of Object.entries(variants)) {
    out.add(normalize(channel));
    for (const tag of Array.isArray(tags) ? tags : []) {
      out.add(normalize(tag));
    }
  }

  for (const [channel, value] of Object.entries(active)) {
    out.add(normalize(channel));
    out.add(normalize(value));
  }

  for (const rv of rawVariants) {
    if (rv?.channel) out.add(normalize(rv.channel));
    if (rv?.active != null) out.add(normalize(rv.active));
    if (rv?.selected != null) out.add(normalize(rv.selected));
    if (rv?.value != null) out.add(normalize(rv.value));
    if (rv?.tag != null) out.add(normalize(rv.tag));

    const owned =
      (Array.isArray(rv?.owned) && rv.owned) ||
      (Array.isArray(rv?.ownedVariants) && rv.ownedVariants) ||
      (Array.isArray(rv?.ownedTags) && rv.ownedTags) ||
      (Array.isArray(rv?.tags) && rv.tags) ||
      [];

    for (const tag of owned) {
      out.add(normalize(tag));
    }
  }

  return out;
}

function snapshotHasStyle(snapshotCosmetic, styleName) {
  const want = normalize(styleName);
  if (!want) return false;

  const strings = collectSnapshotStrings(snapshotCosmetic);

  if (strings.has(want)) return true;

  for (const s of strings) {
    if (s.includes(want)) return true;
  }

  return false;
}

function snapshotHasCosmeticId(snapshot, cosmeticId) {
  const cosmetics = snapshot?.cosmetics || {};
  return Boolean(cosmetics[normalize(cosmeticId)]);
}

async function snapshotOwnsEntry(snapshot, entry) {
  if (!snapshot?.cosmetics) return false;

  if (entry?.kind === "bundle") {
    const items = Array.isArray(entry?.items) ? entry.items : [];
    return items.some((item) => snapshotHasCosmeticId(snapshot, item.id));
  }

  const cosmeticId = await resolveCosmeticId(entry);
  if (!cosmeticId) return false;

  const snapshotCosmetic = snapshot?.cosmetics?.[normalize(cosmeticId)];
  if (!snapshotCosmetic) return false;

  if (entry?.kind === "style") {
    return snapshotHasStyle(snapshotCosmetic, entry?.styleName);
  }

  return true;
}

function getRoleEntries() {
  return (Array.isArray(EXCLUSIVES_LIST) ? EXCLUSIVES_LIST : []).map((entry) => ({
    ...entry,
    roleName: entryRoleLabel(entry),
  }));
}

async function ensureRole(guild, roleName) {
  let role = guild.roles.cache.find((r) => r.name === roleName);
  if (role) return role;

  role = await guild.roles.create({
    name: roleName,
    reason: "Auto-created exclusive locker role",
    mentionable: false,
    hoist: false,
  });

  return role;
}

async function syncExclusiveRolesForMember(member, snapshot) {
  if (!member || !snapshot?.cosmetics) {
    return { created: [], added: [], removed: [] };
  }

  const entries = getRoleEntries();
  const created = [];
  const added = [];
  const removed = [];

  for (const entry of entries) {
    const shouldHave = await snapshotOwnsEntry(snapshot, entry);
    const roleName = entry.roleName;

    if (!roleName) continue;

    let role = member.guild.roles.cache.find((r) => r.name === roleName);

    if (shouldHave && !role) {
      role = await ensureRole(member.guild, roleName);
      created.push(role.name);
    }

    if (!role) continue;

    const hasRole = member.roles.cache.has(role.id);

    if (shouldHave && !hasRole) {
      await member.roles.add(role.id).catch(() => {});
      added.push(role.name);
    }

    if (!shouldHave && hasRole) {
      await member.roles.remove(role.id).catch(() => {});
      removed.push(role.name);
    }
  }

  return { created, added, removed };
}

module.exports = {
  normalize,
  safeRoleName,
  loadCosmeticIndex,
  resolveCosmeticId,
  entryRoleLabel,
  entryRareLabel,
  collectSnapshotStrings,
  snapshotHasStyle,
  snapshotHasCosmeticId,
  snapshotOwnsEntry,
  getRoleEntries,
  ensureRole,
  syncExclusiveRolesForMember,
};