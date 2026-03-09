// dbInit.js
const pool = require("./database");

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS epic_tokens (
      discord_user_id TEXT PRIMARY KEY,
      epic_account_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      expires_in INTEGER,
      created_at BIGINT NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS locker_snapshots (
      discord_user_id TEXT PRIMARY KEY,
      snapshot_json JSONB NOT NULL,
      updated_at BIGINT NOT NULL
    );
  `);

  console.log("✓ Database ready");
}

module.exports = { initDatabase };