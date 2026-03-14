// deploy-commands.js
// Registers all slash commands globally using DISCORD_APP_ID

require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Environment variables
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APP_ID = process.env.DISCORD_APP_ID;

// Load command files
const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

console.log(`📁 Found ${commandFiles.length} command files.`);

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    try {
        const command = require(filePath);

        if (!command.data || !command.data.toJSON) {
            console.log(`⚠️ Skipping ${file} (missing SlashCommandBuilder export)`);
            continue;
        }

        const json = command.data.toJSON();
        commands.push(json);

        console.log(`✅ Loaded /${json.name} from ${file}`);
    } catch (err) {
        console.log(`❌ Failed to load ${file}:`, err.message);
    }
}

// Create REST instance
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

// Deploy commands
(async () => {
    try {
        console.log(`\n🚀 Deploying ${commands.length} commands globally...`);

        await rest.put(
            Routes.applicationCommands(DISCORD_APP_ID),
            { body: commands }
        );

        console.log(`✅ Successfully registered ${commands.length} global commands!\n`);

        console.log("📝 Registered commands:");
        commands.forEach(cmd => console.log(` - /${cmd.name}`));

        console.log("\n⚠️ Global commands may take a few minutes to appear in Discord.");
    } catch (error) {
        console.error("❌ Error deploying commands:", error);
    }
})();