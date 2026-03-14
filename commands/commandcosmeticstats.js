// commands/commandcosmeticstats.js

const { SlashCommandBuilder } = require("discord.js");
const { buildCosmeticStatsEmbed } = require("../utils/cosmeticStatsUI");
const { getAllLockerSnapshots } = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstats")
    .setDescription("Show tracked ownership stats for a cosmetic")
    .addStringOption((option) =>
      option
        .setName("cosmetic")
        .setDescription("Cosmetic name or ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString("cosmetic", true);
    const snapshots = (await getAllLockerSnapshots()) || {};

    const embed = await buildCosmeticStatsEmbed({
      query,
      snapshots,
      requestedBy: interaction.user.username,
    });

    return interaction.editReply({
      embeds: [embed],
    });
  },
};
