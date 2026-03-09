// commands/cosmeticstyles.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getRoleEntries } = require("../utils/exclusiveRoleSync");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstyles")
    .setDescription("List tracked exclusive cosmetic styles"),

  async execute(interaction) {
    const entries = getRoleEntries();

    const lines = entries
      .filter((e) => e.kind === "style")
      .map((e) => `• ${e.rareLabel}`);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Tracked Cosmetic Styles")
      .setDescription(lines.join("\n"));

    return interaction.reply({
      embeds: [embed],
    });
  },
};