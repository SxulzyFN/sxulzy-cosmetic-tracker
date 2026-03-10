// utils/exclusiveRoleSync.js
const axios = require("axios");
const roleConfig = require("./exclusiveslist");

const FORTNITE_API_TTL = 1000 * 60 * 60 * 6;

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

  if (cosmeticsById && cosmeticsByName && now - cachedAt < FORTNITE_API_TTL) {
    return { cosmeticsById, cosmeticsByName };
  }

  const res = await axios.get("https://fortnite-api.com/v2/cosmetics/br", {
    timeout: 30000,
  });

  const all = Array.isArray(res.data?.data) ? res.data.data : [];
  cosmeticsById = new Map();
  cosmeticsByName = new Map();

  for (const cosmetic of all) {
    const id = normalize(cosmetic?.id);
    const name = normalize(cosmetic?.name);

    if (id) cosmeticsById.set(id, cosmetic);
    if (name && !cosmeticsByName.has(name)) cosmeticsByName.set(name, cosmetic);
  }

  cachedAt = now;
  return { cosmeticsById, cosmeticsByName };
}

async function resolveCosmeticId(entry) {
  const directId = normalize(entry?.cosmetic?.id);
  if (directId) return directId;

  const byName = normalize(entry?.cosmetic?.name);
  if (!byName) return null;

  const { cosmeticsByName } = await loadCosmeticIndex();
  const match = cosmeticsByName.get(byName);
  return match?.id ? normalize(match.id) : null;
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

  for (const value of strings) {
    if (value.includes(want)) return true;
  }

  return false;
}

function snapshotHasCosmeticId(snapshot, cosmeticId) {
  const cosmetics = snapshot?.cosmetics || {};
  return Boolean(cosmetics[normalize(cosmeticId)]);
}

function buildEntriesFromConfig() {
  if (Array.isArray(roleConfig.EXCLUSIVES_LIST)) {
    return roleConfig.EXCLUSIVES_LIST.map((entry) => ({
      ...entry,
      roleName: safeRoleName(
        entry.roleName ||
          entry.rareLabel ||
          entry.roleLabel ||
          entry.label ||
          entry?.cosmetic?.name ||
          entry?.cosmetic?.id ||
          "Exclusive"
      ),
      rareLabel:
        entry.rareLabel ||
        entry.label ||
        entry.roleLabel ||
        entry?.cosmetic?.name ||
        entry?.cosmetic?.id ||
        "Exclusive",
    }));
  }

  const entries = [];

  const itemsConfig = roleConfig.ALL_EXCLUSIVE_ITEMS || {};
  for (const [category, ids] of Object.entries(itemsConfig)) {
    for (const id of Array.isArray(ids) ? ids : []) {
      entries.push({
        kind: "item",
        category,
        cosmetic: { id: String(id) },
        roleName: safeRoleName(String(id)),
        rareLabel: String(id),
      });
    }
  }

  const stylesConfig =
    roleConfig.EXCLUSIVE_EDIT_STYLES || roleConfig.ALL_EXCLUSIVE_STYLES || [];

  if (Array.isArray(stylesConfig)) {
    for (const style of stylesConfig) {
      entries.push({
        kind: "style",
        category: style.category || "styles",
        cosmetic: {
          name: String(style.cosmeticName || ""),
        },
        styleName: String(style.styleText || ""),
        roleName: safeRoleName(
          `${style.cosmeticName || "Style"} | ${style.styleText || "Style"}`
        ),
        rareLabel: `${style.cosmeticName || "Style"} | ${style.styleText || "Style"}`,
      });
    }
  } else {
    for (const [category, list] of Object.entries(stylesConfig)) {
      for (const style of Array.isArray(list) ? list : []) {
        entries.push({
          kind: "style",
          category,
          cosmetic: {
            name: String(style.cosmeticName || ""),
          },
          styleName: String(style.styleText || ""),
          roleName: safeRoleName(
            `${style.cosmeticName || "Style"} | ${style.styleText || "Style"}`
          ),
          rareLabel: `${style.cosmeticName || "Style"} | ${style.styleText || "Style"}`,
        });
      }
    }
  }

  return entries;
}

function getRoleEntries() {
  return buildEntriesFromConfig();
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
    return {
      created: [],
      added: [],
      removed: [],
      reason: "missing_member_or_snapshot",
    };
  }

  const guild = member.guild;
  const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));

  if (!me) {
    return {
      created: [],
      added: [],
      removed: [],
      reason: "bot_member_not_found",
    };
  }

  if (!me.permissions.has("ManageRoles")) {
    return {
      created: [],
      added: [],
      removed: [],
      reason: "missing_manage_roles_permission",
    };
  }

  const entries = getRoleEntries();
  const created = [];
  const added = [];
  const removed = [];

  for (const entry of entries) {
    const shouldHave = await snapshotOwnsEntry(snapshot, entry);
    const roleName = safeRoleName(entry.roleName || entry.rareLabel || "Exclusive");
    if (!roleName) continue;

    let role = guild.roles.cache.find((r) => r.name === roleName);

    if (shouldHave && !role) {
      role = await ensureRole(guild, roleName).catch(() => null);
      if (role) created.push(role.name);
    }

    if (!role) continue;

    if (me.roles.highest.comparePositionTo(role) <= 0) {
      continue;
    }

    const hasRole = member.roles.cache.has(role.id);

    if (shouldHave && !hasRole) {
      await member.roles.add(role).catch(() => {});
      added.push(role.name);
    }

    if (!shouldHave && hasRole) {
      await member.roles.remove(role).catch(() => {});
      removed.push(role.name);
    }
  }

  return {
    created,
    added,
    removed,
    reason: "ok",
  };
}

module.exports = {
  normalize,
  loadCosmeticIndex,
  resolveCosmeticId,
  collectSnapshotStrings,
  snapshotHasStyle,
  snapshotHasCosmeticId,
  snapshotOwnsEntry,
  getRoleEntries,
  ensureRole,
  syncExclusiveRolesForMember,
};
