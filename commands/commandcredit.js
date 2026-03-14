// commands/commandcredit.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("credit")
    .setDescription("Shows who created the bot"),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("🤖 Bot Credits")
      .setDescription(
        "Created by **sxulzy\\_** & helped by **\\_adamo\\_**"
      );

    await interaction.reply({ embeds: [embed] });
  },
};