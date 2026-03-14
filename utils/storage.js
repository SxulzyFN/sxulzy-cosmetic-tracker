// storage.js
const fs = require("fs");
const path = require("path");

let Pool = null;
try {
  ({ Pool } = require("pg"));
} catch {
  Pool = null;
}

const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();
const USE_DB = Boolean(DATABASE_URL && Pool);

const TOKENS_FILE = path.join(__dirname, "tokens.json");
const LOCKER_SNAPSHOTS_FILE = path.join(__dirname, "lockerSnapshots.json");

let pool = null;
let dbReadyPromise = null;

function ensureJsonFile(file, fallback = {}) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(fallback, null, 2), "utf8");
  }
}

function readJson(file, fallback = {}) {
  try {
    ensureJsonFile(file, fallback);
    const raw = fs.readFileSync(file, "utf8");
    if (!raw || !raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureJsonFile(file, {});
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function getPool() {
  if (!USE_DB) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl:
        DATABASE_URL.includes("railway.internal") || DATABASE_URL.includes("localhost")
          ? false
          : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureDb() {
  if (!USE_DB) return;

  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      const db = getPool();
      await db.query(`
        CREATE TABLE IF NOT EXISTS user_tokens (
          discord_id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS locker_snapshots (
          discord_id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })();
  }

  await dbReadyPromise;
}

// --------------------
// TOKENS
// --------------------
async function getTokens(discordId) {
  const id = String(discordId || "").trim();
  if (!id) return null;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    const result = await db.query(
      `SELECT data FROM user_tokens WHERE discord_id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0]?.data || null;
  }

  const data = readJson(TOKENS_FILE, {});
  return data[id] || null;
}

async function saveTokens(discordId, tokens) {
  const id = String(discordId || "").trim();
  if (!id) return;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    await db.query(
      `
      INSERT INTO user_tokens (discord_id, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (discord_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `,
      [id, JSON.stringify(tokens || {})]
    );
    return;
  }

  const data = readJson(TOKENS_FILE, {});
  data[id] = tokens || {};
  writeJson(TOKENS_FILE, data);
}

async function deleteTokens(discordId) {
  const id = String(discordId || "").trim();
  if (!id) return;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    await db.query(`DELETE FROM user_tokens WHERE discord_id = $1`, [id]);
    return;
  }

  const data = readJson(TOKENS_FILE, {});
  delete data[id];
  writeJson(TOKENS_FILE, data);
}

// --------------------
// SNAPSHOTS
// --------------------
async function saveUserLockerSnapshot(discordId, snapshot) {
  const id = String(discordId || "").trim();
  if (!id) return;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    await db.query(
      `
      INSERT INTO locker_snapshots (discord_id, data, updated_at)
      VALUES ($1, $2::jsonb, NOW())
      ON CONFLICT (discord_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `,
      [id, JSON.stringify(snapshot || {})]
    );
    return;
  }

  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  data[id] = snapshot || {};
  writeJson(LOCKER_SNAPSHOTS_FILE, data);
}

async function getAllLockerSnapshots() {
  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    const result = await db.query(`SELECT discord_id, data FROM locker_snapshots`);
    const out = {};
    for (const row of result.rows) {
      out[row.discord_id] = row.data;
    }
    return out;
  }

  return readJson(LOCKER_SNAPSHOTS_FILE, {});
}

async function getLockerSnapshot(discordId) {
  const id = String(discordId || "").trim();
  if (!id) return null;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    const result = await db.query(
      `SELECT data FROM locker_snapshots WHERE discord_id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0]?.data || null;
  }

  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  return data[id] || null;
}

async function deleteUserLockerSnapshot(discordId) {
  const id = String(discordId || "").trim();
  if (!id) return;

  if (USE_DB) {
    await ensureDb();
    const db = getPool();
    await db.query(`DELETE FROM locker_snapshots WHERE discord_id = $1`, [id]);
    return;
  }

  const data = readJson(LOCKER_SNAPSHOTS_FILE, {});
  delete data[id];
  writeJson(LOCKER_SNAPSHOTS_FILE, data);
}

// --------------------
// COSMETIC STATS
// --------------------
async function computeCosmeticStats(cosmeticIdLower) {
  const target = String(cosmeticIdLower || "").toLowerCase();
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

    const cosmetic = cosmetics[target];
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