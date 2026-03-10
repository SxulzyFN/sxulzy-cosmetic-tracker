// commands/commandcosmeticstyles.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

let getRoleEntries = null;

// Safely attempt to load exclusiveRoleSync
try {
  const roleSync = require("../utils/exclusiveRoleSync");
  getRoleEntries = roleSync.getRoleEntries;
} catch (err) {
  console.warn("exclusiveRoleSync not found. Cosmetic styles command will still run.");
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstyles")
    .setDescription("List tracked exclusive cosmetic styles"),

  async execute(interaction) {
    if (!getRoleEntries) {
      const embed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle("Cosmetic Styles")
        .setDescription(
          "⚠️ Exclusive role sync module not loaded.\n\nMake sure `utils/exclusiveRoleSync.js` exists."
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const entries = getRoleEntries();

    const styleEntries = entries.filter((e) => e.kind === "style");

    if (!styleEntries.length) {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("Tracked Cosmetic Styles")
        .setDescription("No cosmetic styles are currently tracked.");

      return interaction.reply({ embeds: [embed] });
    }

    const lines = styleEntries.map((e) => `• ${e.rareLabel}`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Tracked Cosmetic Styles")
      .setDescription(lines.join("\n"));

    return interaction.reply({
      embeds: [embed],
    });
  },
};
