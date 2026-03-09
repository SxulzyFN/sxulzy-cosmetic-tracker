// storage.js

const fs = require("fs");
const path = require("path");
const pool = require("./database");

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
// TOKENS (POSTGRES)
// --------------------
async function getTokens(discordId) {
  const result = await pool.query(
    `
    SELECT
      epic_account_id,
      access_token,
      refresh_token,
      expires_in,
      created_at
    FROM epic_tokens
    WHERE discord_user_id = $1
    `,
    [discordId]
  );

  if (!result.rows.length) return null;

  const row = result.rows[0];

  return {
    accountId: row.epic_account_id,
    accessToken: row.access_token,
    refreshToken: row.refresh_token,
    expiresIn: row.expires_in,
    createdAt: Number(row.created_at),
  };
}

async function saveTokens(discordId, tokens) {
  await pool.query(
    `
    INSERT INTO epic_tokens (
      discord_user_id,
      epic_account_id,
      access_token,
      refresh_token,
      expires_in,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (discord_user_id)
    DO UPDATE SET
      epic_account_id = EXCLUDED.epic_account_id,
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_in = EXCLUDED.expires_in,
      created_at = EXCLUDED.created_at
    `,
    [
      discordId,
      tokens.accountId,
      tokens.accessToken,
      tokens.refreshToken,
      tokens.expiresIn,
      tokens.createdAt,
    ]
  );
}

async function deleteTokens(discordId) {
  await pool.query(
    `DELETE FROM epic_tokens WHERE discord_user_id = $1`,
    [discordId]
  );
}

// --------------------
// SNAPSHOTS (JSON FILE)
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