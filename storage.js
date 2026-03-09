// storage.js
const pool = require("./database");

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
// SNAPSHOTS (POSTGRES)
// --------------------
async function saveUserLockerSnapshot(discordId, snapshot) {
  await pool.query(
    `
    INSERT INTO locker_snapshots (
      discord_user_id,
      snapshot_json,
      updated_at
    )
    VALUES ($1, $2::jsonb, $3)
    ON CONFLICT (discord_user_id)
    DO UPDATE SET
      snapshot_json = EXCLUDED.snapshot_json,
      updated_at = EXCLUDED.updated_at
    `,
    [discordId, JSON.stringify(snapshot || {}), Date.now()]
  );
}

async function getAllLockerSnapshots() {
  const result = await pool.query(`
    SELECT discord_user_id, snapshot_json
    FROM locker_snapshots
  `);

  const out = {};

  for (const row of result.rows) {
    out[row.discord_user_id] = row.snapshot_json;
  }

  return out;
}

async function getLockerSnapshot(discordId) {
  const result = await pool.query(
    `
    SELECT snapshot_json
    FROM locker_snapshots
    WHERE discord_user_id = $1
    `,
    [discordId]
  );

  if (!result.rows.length) return null;
  return result.rows[0].snapshot_json;
}

async function deleteUserLockerSnapshot(discordId) {
  await pool.query(
    `DELETE FROM locker_snapshots WHERE discord_user_id = $1`,
    [discordId]
  );
}

// --------------------
// COSMETIC STATS
// --------------------
async function computeCosmeticStats(cosmeticIdLower) {
  const data = await getAllLockerSnapshots();

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