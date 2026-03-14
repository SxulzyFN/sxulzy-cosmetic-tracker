// commands/commandlogout.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { deleteTokens } = require("../utils/storage");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("logout")
    .setDescription("Unlink your Epic Games account from the bot"),

  async execute(interaction) {
    try {
      await deleteTokens(interaction.user.id);

      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Logged out")
        .setDescription("Your saved Epic login has been removed.");

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("Logout error:", error);

      return interaction.reply({
        content: `❌ Failed to log out: ${error.message || "Unknown error"}`,
        ephemeral: true,
      });
    }
  },
};
