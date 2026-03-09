// commands/login.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("login")
    .setDescription("Link your Epic Games account to fetch your Fortnite locker"),

  async execute(interaction) {
    const authUrl = process.env.EPIC_AUTH_URL;

    if (!authUrl) {
      return interaction.reply({
        content: "❌ EPIC_AUTH_URL is missing from your .env file.",
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("enter_auth_code")
        .setLabel("Enter Authorization Code")
        .setStyle(ButtonStyle.Primary)
    );

    const embed = new EmbedBuilder()
      .setColor(0x9146ff)
      .setTitle("🎮 Link Your Epic Games Account")
      .setDescription("Follow these steps to link your account:")
      .addFields(
        {
          name: "📋 Step 1",
          value: `[Click here to authorize](${authUrl})`,
          inline: false,
        },
        {
          name: "🔐 Step 2",
          value: "Log in to Epic Games and approve access.",
          inline: false,
        },
        {
          name: "📝 Step 3",
          value: "Copy the code from the redirected URL (after `?code=`).",
          inline: false,
        },
        {
          name: "✅ Step 4",
          value: "Click the button below and paste the code.",
          inline: false,
        }
      )
      .setFooter({ text: "⚠️ Codes expire quickly — paste it immediately." })
      .setTimestamp();

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: false,
    });
  },
};