// utils/cosmeticStatsUI.js

const { EmbedBuilder } = require("discord.js");

function buildStatsEmbed(snapshots) {
  const users = Object.values(snapshots || {});
  const totalUsers = users.length;

  let cosmeticCount = 0;

  for (const snapshot of users) {
    const cosmetics = snapshot?.cosmetics || {};
    cosmeticCount += Object.keys(cosmetics).length;
  }

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle("Cosmetic Statistics")
    .addFields(
      {
        name: "Tracked Lockers",
        value: String(totalUsers),
        inline: true,
      },
      {
        name: "Total Cosmetics",
        value: String(cosmeticCount),
        inline: true,
      }
    );

  return embed;
}

module.exports = {
  buildStatsEmbed,
};