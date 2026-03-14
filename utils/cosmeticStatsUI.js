// utils/cosmeticStatsUI.js

const { EmbedBuilder } = require("discord.js");
const {
  findCosmetic,
  normalize,
  getBestImage,
  getBestType,
  getBestRarity,
} = require("./cosmeticLookup");

function countTrackedLockers(snapshots) {
  return Object.keys(snapshots || {}).length;
}

function computeCosmeticStatsFromSnapshots(snapshots, cosmeticId) {
  const data = snapshots || {};
  const cosmeticIdLower = normalize(cosmeticId);

  let owners = 0;
  let totalTrackedUsers = 0;
  const styleCounts = {};

  for (const userId of Object.keys(data)) {
    const snapshot = data[userId];
    if (!snapshot || typeof snapshot !== "object") continue;

    totalTrackedUsers++;

    const cosmetics = snapshot?.cosmetics;
    if (!cosmetics || typeof cosmetics !== "object") continue;

    const cosmetic = cosmetics[cosmeticIdLower];
    if (!cosmetic) continue;

    owners++;

    const variants = cosmetic?.variants || {};
    for (const channel of Object.keys(variants)) {
      styleCounts[channel] ??= {};

      const tags = Array.isArray(variants[channel]) ? variants[channel] : [];
      const uniqueTags = [...new Set(tags.map((x) => String(x)))];

      for (const tag of uniqueTags) {
        styleCounts[channel][tag] = (styleCounts[channel][tag] || 0) + 1;
      }
    }
  }

  return {
    owners,
    totalTrackedUsers,
    styleCounts,
  };
}

function formatPercent(part, total) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function prettifyStyleText(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\./g, " ")
    .replace(/cosmetics/gi, "")
    .replace(/item/gi, "")
    .replace(/variant/gi, "")
    .replace(/\s+/g, " ")
    .trim() || "Unknown";
}

async function buildCosmeticStatsEmbed({ query, snapshots, requestedBy }) {
  const cosmetic = await findCosmetic(query);

  if (!cosmetic) {
    return new EmbedBuilder()
      .setColor(0xff3b30)
      .setTitle("Cosmetic not found")
      .setDescription(`No Fortnite cosmetic matched \`${query}\`.`);
  }

  const stats = computeCosmeticStatsFromSnapshots(snapshots, cosmetic.id);
  const trackedLockers = countTrackedLockers(snapshots);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(cosmetic.name || cosmetic.id)
    .addFields(
      {
        name: "Tracked lockers",
        value: String(trackedLockers),
        inline: true,
      },
      {
        name: "Owners",
        value: String(stats.owners),
        inline: true,
      },
      {
        name: "Ownership",
        value: formatPercent(stats.owners, trackedLockers),
        inline: true,
      },
      {
        name: "Type",
        value: String(getBestType(cosmetic)),
        inline: true,
      },
      {
        name: "Rarity",
        value: String(getBestRarity(cosmetic)),
        inline: true,
      },
      {
        name: "Cosmetic ID",
        value: `\`${cosmetic.id}\``,
        inline: false,
      }
    )
    .setFooter({
      text: requestedBy
        ? `Requested by ${requestedBy}`
        : "Tracked locker stats",
    });

  const image = getBestImage(cosmetic);
  if (image) {
    embed.setThumbnail(image);
  }

  return embed;
}

async function buildCosmeticStylesEmbed({ query, snapshots, requestedBy }) {
  const cosmetic = await findCosmetic(query);

  if (!cosmetic) {
    return new EmbedBuilder()
      .setColor(0xff3b30)
      .setTitle("Cosmetic not found")
      .setDescription(`No Fortnite cosmetic matched \`${query}\`.`);
  }

  const stats = computeCosmeticStatsFromSnapshots(snapshots, cosmetic.id);
  const trackedLockers = countTrackedLockers(snapshots);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`${cosmetic.name || cosmetic.id} — Styles`)
    .addFields(
      {
        name: "Tracked lockers",
        value: String(trackedLockers),
        inline: true,
      },
      {
        name: "Owners",
        value: String(stats.owners),
        inline: true,
      },
      {
        name: "Type",
        value: String(getBestType(cosmetic)),
        inline: true,
      },
      {
        name: "Cosmetic ID",
        value: `\`${cosmetic.id}\``,
        inline: false,
      }
    )
    .setFooter({
      text: requestedBy
        ? `Requested by ${requestedBy}`
        : "Tracked style stats",
    });

  const image = getBestImage(cosmetic);
  if (image) {
    embed.setThumbnail(image);
  }

  const styleChannels = Object.keys(stats.styleCounts || {});
  if (!styleChannels.length) {
    embed.setDescription("No tracked styles were found for this cosmetic.");
    return embed;
  }

  for (const channel of styleChannels.slice(0, 12)) {
    const entries = Object.entries(stats.styleCounts[channel] || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => `• ${prettifyStyleText(tag)} — ${count}`)
      .join("\n");

    embed.addFields({
      name: prettifyStyleText(channel),
      value: entries || "No tracked styles",
      inline: false,
    });
  }

  return embed;
}

module.exports = {
  buildCosmeticStatsEmbed,
  buildCosmeticStylesEmbed,
  computeCosmeticStatsFromSnapshots,
};