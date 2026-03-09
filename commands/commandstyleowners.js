// commands/styleowners.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { buildRareOwnersBoard } = require("../utils/rareownersboard");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("styleowners")
    .setDescription("Show tracked owners of rare cosmetics"),

  async execute(interaction) {
    await interaction.deferReply();

    const board = await buildRareOwnersBoard();

    const lines = board.rows.map((row) => {
      const label = row.owners === 1 ? "owner" : "owners";
      return `**${row.label}** — ${row.owners} ${label}`;
    });

    const embed = new EmbedBuilder()
      .setColor(0xffd166)
      .setTitle("🏆 Rare Owners")
      .setDescription(
        `Tracked lockers: **${board.trackedLockers}**\n\n${lines.join("\n")}`
      );

    return interaction.editReply({
      embeds: [embed],
    });
  },
};