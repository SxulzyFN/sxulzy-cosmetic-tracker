const fs = require("fs");
const path = require("path");

const TOKENS_FILE = path.join(__dirname, "tokens.json");
const LOCKER_SNAPSHOTS_FILE = path.join(__dirname, "lockerSnapshots.json");

function readJson(file, fallback = {}) {
  try {
    if (!fs.existsSync(file)) return fallback;

    const raw = fs.readFileSync(file, "utf8");
    if (!raw || !raw.trim()) return fallback;

    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

// --------------------
// TOKENS
// --------------------
function getTokens(discordId) {
  const data = readJson(TOKENS_FILE, {});
  return data[discordId] || null;
}

function saveTokens(discordId, tokens) {
  const data = readJson(TOKENS_FILE, {});
  data[discordId] = tokens;
  writeJson(TOKENS_FILE, data);
}

function deleteTokens(discordId) {
  const data = readJson(TOKENS_FILE, {});
  delete data[discordId];
  writeJson(TOKENS_FILE, data);
}

// --------------------
// SNAPSHOTS
// --------------------
function saveUserLockerSnapshot(discordId, snapshot) {
  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  data[discordId] = snapshot;
  writeJson(LOCKER_SNAPSHOTS_FILE, data);
}

function getAllLockerSnapshots() {
  return readJson(LOCKER_SNAPSHOTS_FILE, {});
}

function getLockerSnapshot(discordId) {
  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  return data[discordId] || null;
}

function deleteUserLockerSnapshot(discordId) {
  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  delete data[discordId];
  writeJson(LOCKER_SNAPSHOTS_FILE, data);
}

// --------------------
// COSMETIC STATS
// --------------------
function computeCosmeticStats(cosmeticIdLower) {
  const data = getAllLockerSnapshots();

  let owners = 0;
  let totalTrackedUsers = 0;
  const styleCounts = {};

  for (const userId of Object.keys(data)) {
    const snapshot = data[userId];
    if (!snapshot || typeof snapshot !== "object") continue;

    totalTrackedUsers++;

    const cosmetics = snapshot?.cosmetics;
    if (!cosmetics || typeof cosmetics !== "object") continue;

    const cosmetic = cosmetics[String(cosmeticIdLower).toLowerCase()];
    if (!cosmetic) continue;

    owners++;

    const variants = cosmetic?.variants || {};
    for (const channel of Object.keys(variants)) {
      styleCounts[channel] ??= {};

      const tags = Array.isArray(variants[channel]) ? variants[channel] : [];
      const uniqueTags = [...new Set(tags.map((x) => String(x)))];

      for (const tag of uniqueTags) {
        styleCounts[channel][tag] = (styleCounts[channel][tag] || 0) + 1;
      }
    }
  }

  return {
    owners,
    totalTrackedUsers,
    styleCounts,
  };
}

module.exports = {
  getTokens,
  saveTokens,
  deleteTokens,
  saveUserLockerSnapshot,
  getAllLockerSnapshots,
  getLockerSnapshot,
  deleteUserLockerSnapshot,
  computeCosmeticStats,
};