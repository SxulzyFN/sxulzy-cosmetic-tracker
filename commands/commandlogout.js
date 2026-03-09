// commands/logout.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { deleteTokens, deleteUserLockerSnapshot } = require("../storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logout")
    .setDescription("Unlink your Epic Games account from the bot"),

  async execute(interaction) {
    const discordUserId = interaction.user.id;

    deleteTokens(discordUserId);
    deleteUserLockerSnapshot(discordUserId);

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle("✅ Logged out successfully")
      .setDescription("Your Epic link and saved locker snapshot have been removed.");

    return interaction.reply({ embeds: [embed] }); // no ephemeral
  },
};