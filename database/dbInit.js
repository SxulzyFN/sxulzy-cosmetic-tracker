// dbInit.js
const { Pool } = require("pg");

const DATABASE_URL = String(process.env.DATABASE_URL || "").trim();

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from environment variables");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl:
    DATABASE_URL.includes("railway.internal") || DATABASE_URL.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
});

async function tableHasColumn(client, tableName, columnName) {
  const result = await client.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = $1
      AND column_name = $2
    LIMIT 1
    `,
    [tableName, columnName]
  );

  return result.rowCount > 0;
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = $1
    LIMIT 1
    `,
    [tableName]
  );

  return result.rowCount > 0;
}

async function recreateBrokenTable(client, tableName) {
  await client.query(`DROP TABLE IF EXISTS ${tableName}`);
}

async function initDatabase() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------
    // Fix broken old tables
    // --------------------
    if (await tableExists(client, "user_tokens")) {
      const hasDiscordId = await tableHasColumn(client, "user_tokens", "discord_id");
      const hasData = await tableHasColumn(client, "user_tokens", "data");

      if (!hasDiscordId || !hasData) {
        console.log("⚠️ Recreating broken user_tokens table...");
        await recreateBrokenTable(client, "user_tokens");
      }
    }

    if (await tableExists(client, "locker_snapshots")) {
      const hasDiscordId = await tableHasColumn(client, "locker_snapshots", "discord_id");
      const hasData = await tableHasColumn(client, "locker_snapshots", "data");

      if (!hasDiscordId || !hasData) {
        console.log("⚠️ Recreating broken locker_snapshots table...");
        await recreateBrokenTable(client, "locker_snapshots");
      }
    }

    // --------------------
    // Create correct tables
    // --------------------
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_tokens (
        discord_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS locker_snapshots (
        discord_id TEXT PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await client.query("COMMIT");
    console.log("✅ Database initialized successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Database init failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  pool,
};