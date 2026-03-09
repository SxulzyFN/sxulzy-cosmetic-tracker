require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

let commandCount = 0;
let eventCount = 0;

/* ---------------- COMMAND LOADER ---------------- */

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command?.data?.name) continue;

  client.commands.set(command.data.name, command);
  commandCount++;
}

/* ---------------- EVENT LOADER ---------------- */

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

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

/* ---------------- LOGIN ---------------- */

client.login(process.env.DISCORD_TOKEN);