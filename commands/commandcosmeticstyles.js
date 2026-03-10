// commands/commandcosmeticstyles.js

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cosmeticstyles")
    .setDescription("List tracked exclusive cosmetic styles"),

  async execute(interaction) {

    const styles = [
      "Renegade Raider – Black & Gold",
      "Aerial Assault Trooper – Black & Gold",
      "Skull Trooper – Purple Glow",
      "Ghoul Trooper – Pink",
      "The Paradigm – Reality Warrior",
      "Aloy – Ice Hunter Aloy",
      "Master Chief – Matte Black",
      "Kratos – Armored Kratos",
      "Marcus Fenix – Matte Black",
      "Fishstick – World Cup",
      "Party Trooper – J Balvin",
      "Party Trooper – Neon",
      "Billie Eilish – Ultraviolet",
      "Aerial Assault One – Black & Gold",
      "Raiders Revenge – Black & Gold",
      "Bow Blades – Chromatic Carvers",
      "Ghost Portal – Purple"
    ];

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Tracked Exclusive Cosmetic Styles")
      .setDescription(styles.map(s => `• ${s}`).join("\n"));

    await interaction.reply({
      embeds: [embed]
    });
  },
};
