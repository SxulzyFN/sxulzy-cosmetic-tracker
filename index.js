// index.js
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { initDatabase } = require("./database/dbInit");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

let commandCount = 0;
let eventCount = 0;

/* ---------------- COMMAND LOADER ---------------- */

const commandsPath = path.join(__dirname, "commands");

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!command?.data?.name) continue;

    client.commands.set(command.data.name, command);
    commandCount++;
  }
} else {
  console.log("⚠️ commands folder not found");
}

/* ---------------- EVENT LOADER ---------------- */

const eventsPath = path.join(__dirname, "events");

if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (!event?.name) continue;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    eventCount++;
  }
} else {
  console.log("⚠️ events folder not found");
}

/* ---------------- READY EVENT ---------------- */

client.once("clientReady", () => {
  const servers = client.guilds.cache.size;

  console.clear();
  console.log(`
╔════════════════════════════╗
║  Sxulzy Cosmetic Tracker   ║
╚════════════════════════════╝

✓ Commands Loaded: ${commandCount}
✓ Events Loaded: ${eventCount}
✓ Servers: ${servers}
✓ Bot Online
`);
});

/* ---------------- STARTUP ---------------- */

initDatabase()
  .then(() => client.login(process.env.DISCORD_TOKEN))
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err);
    process.exit(1);
  });
