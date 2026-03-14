// commands/commandcosmeticstyles.js

const { SlashCommandBuilder } = require("discord.js");
const { buildCosmeticStylesEmbed } = require("../utils/cosmeticStatsUI");
const { getAllLockerSnapshots } = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstyles")
    .setDescription("Show tracked style ownership for a cosmetic")
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

    const embed = await buildCosmeticStylesEmbed({
      query,
      snapshots,
      requestedBy: interaction.user.username,
    });

    return interaction.editReply({
      embeds: [embed],
    });
  },
};
