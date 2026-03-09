// commands/cosmeticstats.js

const { SlashCommandBuilder } = require("discord.js");
const { buildStatsEmbed } = require("../utils/cosmeticStatsUI");
const { getAllLockerSnapshots } = require("../storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstats")
    .setDescription("View statistics for tracked cosmetics"),

  async execute(interaction) {
    await interaction.deferReply();

    const snapshots = getAllLockerSnapshots();

    const embed = await buildStatsEmbed(snapshots);

    return interaction.editReply({
      embeds: [embed],
    });
  },
};