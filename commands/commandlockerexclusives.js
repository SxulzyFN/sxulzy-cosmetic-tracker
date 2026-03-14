// commands/commandlockerexclusives.js
const {
  SlashCommandBuilder,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const axios = require("axios");

const { getLocker, refreshAccessToken } = require("../epic");
const { getTokens, saveTokens } = require("../storage");
const { renderExclusivesCollage } = require("../utils/renderExclusivesCollage");
const {
  ALL_EXCLUSIVE_ITEMS,
  ALL_EXCLUSIVE_STYLES,
  flattenAllExclusiveIds,
  normalizeId,
} = require("../utils/allExclusives");

let cosmeticIndex = null;
let cosmeticIndexAt = 0;
const COSMETIC_CACHE_MS = 1000 * 60 * 60 * 6;

const RARITY_ORDER = [
  "mythic",
  "exotic",
  "icon",
  "marvel",
  "dc",
  "starwars",
  "gaminglegends",
  "lava",
  "frozen",
  "shadow",
  "slurp",
  "legendary",
  "epic",
  "rare",
  "uncommon",
  "common",
];

const EXCLUSIVE_CATEGORY_ORDER = [
  "skins",
  "backblings",
  "pickaxes",
  "gliders",
  "emotes",
  "emoticons",
  "sprays",
  "wraps",
  "kicks",
  "sidekicks",
  "contrails",
  "loadingScreens",
  "toys",
  "banners",
  "musicPacks",
  "jamTracks",
  "jamInstruments",
  "carBodies",
  "carWheels",
  "carBoosts",
  "driftSmokes",
  "legoBuildingSets",
  "legoBuildingProps",
  "rocketRacing",
  "festival",
  "other",
];

function normalizeText(value) {
  return String(value || "").toLowerCase().trim();
}

function normalizeRarityKey(value) {
  const r = normalizeText(value);

  if (!r) return "common";
  if (RARITY_ORDER.includes(r)) return r;
  if (r.includes("gaming")) return "gaminglegends";
  if (r.includes("marvel")) return "marvel";
  if (r.includes("dc")) return "dc";
  if (r.includes("star wars")) return "starwars";
  if (r.includes("icon")) return "icon";
  if (r.includes("shadow")) return "shadow";
  if (r.includes("slurp")) return "slurp";
  if (r.includes("frozen")) return "frozen";
  if (r.includes("lava")) return "lava";
  if (r.includes("mythic")) return "mythic";
  if (r.includes("exotic")) return "exotic";
  if (r.includes("legendary")) return "legendary";
  if (r.includes("epic")) return "epic";
  if (r.includes("rare")) return "rare";
  if (r.includes("uncommon")) return "uncommon";

  return "common";
}

function getRaritySortIndex(value) {
  const key = normalizeRarityKey(value);
  const idx = RARITY_ORDER.indexOf(key);
  return idx === -1 ? RARITY_ORDER.length : idx;
}

function getExclusiveCategorySortIndex(category) {
  const idx = EXCLUSIVE_CATEGORY_ORDER.indexOf(category);
  return idx === -1 ? 999 : idx;
}

function extractItemsWithPrefix(lockerData) {
  const out = [];
  const changes = Array.isArray(lockerData?.profileChanges)
    ? lockerData.profileChanges
    : [];

  for (const change of changes) {
    const itemsObj = change?.profile?.items;
    if (!itemsObj || typeof itemsObj !== "object") continue;

    for (const guid of Object.keys(itemsObj)) {
      const item = itemsObj[guid];
      const templateId = item?.templateId;
      if (typeof templateId !== "string") continue;

      const [prefix, idPart] = templateId.split(":");
      if (!prefix || !idPart) continue;

      out.push({
        guid,
        templateId,
        prefix,
        idPart,
        attributes: item?.attributes || {},
      });
    }
  }

  return out;
}

async function getCosmeticIndex() {
  const now = Date.now();

  if (cosmeticIndex && now - cosmeticIndexAt < COSMETIC_CACHE_MS) {
    return cosmeticIndex;
  }

  const res = await axios.get("https://fortnite-api.com/v2/cosmetics/br", {
    timeout: 30000,
  });

  const data = Array.isArray(res.data?.data) ? res.data.data : [];
  const map = new Map();

  for (const cosmetic of data) {
    if (!cosmetic?.id) continue;
    map.set(normalizeId(cosmetic.id), cosmetic);
  }

  cosmeticIndex = map;
  cosmeticIndexAt = now;

  return cosmeticIndex;
}

function getIconUrl(cosmetic) {
  return (
    cosmetic?.images?.smallIcon ||
    cosmetic?.images?.icon ||
    cosmetic?.images?.featured ||
    cosmetic?.images?.small ||
    null
  );
}

function getRarity(cosmetic) {
  return (
    cosmetic?.series?.value ||
    cosmetic?.series?.id ||
    cosmetic?.rarity?.value ||
    cosmetic?.rarity?.id ||
    cosmetic?.series?.name ||
    cosmetic?.rarity?.name ||
    "common"
  );
}

function getVariantBlob(lockerItem) {
  const rawVariants = Array.isArray(lockerItem?.attributes?.variants)
    ? lockerItem.attributes.variants
    : [];

  const textParts = [];

  for (const variant of rawVariants) {
    if (!variant || typeof variant !== "object") continue;

    if (variant.channel) textParts.push(String(variant.channel));
    if (variant.active) textParts.push(String(variant.active));
    if (variant.selected) textParts.push(String(variant.selected));
    if (variant.value) textParts.push(String(variant.value));
    if (variant.tag) textParts.push(String(variant.tag));

    const arrays = [
      variant.owned,
      variant.ownedTags,
      variant.ownedVariants,
      variant.tags,
    ];

    for (const arr of arrays) {
      if (!Array.isArray(arr)) continue;
      for (const item of arr) textParts.push(String(item));
    }
  }

  return normalizeText(textParts.join(" "));
}

function splitKeywords(styleText) {
  return normalizeText(styleText)
    .replace(/[()]/g, " ")
    .replace(/&/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function styleMatcherHit(lockerItem, cosmetic, matcher) {
  if (!cosmetic?.name) return false;
  if (normalizeText(cosmetic.name) !== normalizeText(matcher.cosmeticName)) return false;

  const blob = getVariantBlob(lockerItem);
  if (!blob) return false;

  const keywords = splitKeywords(matcher.styleText);
  if (!keywords.length) return false;

  return keywords.every((word) => blob.includes(word));
}

function buildStyleDisplayName(cosmeticName, styleText) {
  return `${cosmeticName} (${styleText})`;
}

function buildDirectExclusiveMap() {
  const directMap = new Map();

  for (const [category, ids] of Object.entries(ALL_EXCLUSIVE_ITEMS)) {
    for (const id of ids) {
      directMap.set(normalizeId(id), category);
    }
  }

  return directMap;
}

function sortMatchedItems(items) {
  return [...items].sort((a, b) => {
    const rarityDiff =
      getRaritySortIndex(a?.rarity) - getRaritySortIndex(b?.rarity);
    if (rarityDiff !== 0) return rarityDiff;

    const typeDiff =
      getExclusiveCategorySortIndex(a?.category) -
      getExclusiveCategorySortIndex(b?.category);
    if (typeDiff !== 0) return typeDiff;

    const aName = String(a?.sortName || a?.name || a?.id || "").toLowerCase();
    const bName = String(b?.sortName || b?.name || b?.id || "").toLowerCase();
    return aName.localeCompare(bName);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lockerexclusives")
    .setDescription("Generate an image of all exclusive + unique cosmetics from your locker"),

  async execute(interaction) {
    await interaction.deferReply();

    const discordId = interaction.user.id;
    let tokens = await getTokens(discordId);

    if (!tokens?.accessToken || !tokens?.accountId) {
      const embed = new EmbedBuilder()
        .setColor(0xff3b30)
        .setTitle("❌ Not Logged In")
        .setDescription("Use **/login** first to link your Epic Games account.");
      return interaction.editReply({ embeds: [embed] });
    }

    let lockerData;

    try {
      lockerData = await getLocker(tokens.accessToken, tokens.accountId);
    } catch (e) {
      const msg =
        e?.response?.data?.error_description ||
        e?.response?.data?.error ||
        e.message;

      const expired =
        e?.code === "TOKEN_EXPIRED" ||
        e?.response?.status === 401 ||
        String(msg).toLowerCase().includes("expired");

      if (!expired || !tokens?.refreshToken) {
        return interaction.editReply(`❌ Error fetching locker: ${msg}`);
      }

      try {
        const refreshed = await refreshAccessToken(tokens.refreshToken);

        const savedTokens = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          accountId: refreshed.accountId,
          expiresIn: refreshed.expiresIn,
          createdAt: Date.now(),
        };

        await saveTokens(discordId, savedTokens);
        tokens = savedTokens;

        lockerData = await getLocker(tokens.accessToken, tokens.accountId);
      } catch (e2) {
        const msg2 =
          e2?.response?.data?.error_description ||
          e2?.response?.data?.error ||
          e2.message;

        return interaction.editReply(`❌ Error fetching locker after refresh: ${msg2}`);
      }
    }

    const lockerItems = extractItemsWithPrefix(lockerData);
    const cosmeticsById = await getCosmeticIndex();

    const fullExclusiveIdSet = flattenAllExclusiveIds();
    const directExclusiveMap = buildDirectExclusiveMap();

    const matched = [];
    const seen = new Set();

    for (const lockerItem of lockerItems) {
      const itemId = normalizeId(lockerItem.idPart);
      const cosmetic = cosmeticsById.get(itemId);

      if (fullExclusiveIdSet.has(itemId)) {
        const key = `id:${itemId}`;
        if (!seen.has(key)) {
          seen.add(key);

          matched.push({
            id: cosmetic?.id || lockerItem.idPart,
            name: cosmetic?.name || lockerItem.idPart,
            iconUrl: getIconUrl(cosmetic),
            rarity: getRarity(cosmetic),
            category: directExclusiveMap.get(itemId) || "other",
            sortName: normalizeText(cosmetic?.name || lockerItem.idPart),
            prefix: lockerItem.prefix,
            idPart: lockerItem.idPart,
          });
        }
      }

      if (!cosmetic) continue;

      for (const matcher of ALL_EXCLUSIVE_STYLES) {
        if (!styleMatcherHit(lockerItem, cosmetic, matcher)) continue;

        const key = `style:${normalizeText(cosmetic.name)}:${normalizeText(matcher.styleText)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        matched.push({
          id: `${cosmetic.id}::${matcher.styleText}`,
          name: buildStyleDisplayName(cosmetic.name, matcher.styleText),
          iconUrl: getIconUrl(cosmetic),
          rarity: getRarity(cosmetic),
          category: matcher.category || "other",
          sortName: normalizeText(cosmetic.name),
          prefix: lockerItem.prefix,
          idPart: lockerItem.idPart,
        });
      }
    }

    const sortedMatched = sortMatchedItems(matched);
    const renderable = sortedMatched.filter((x) => x.iconUrl);

    if (!renderable.length) {
      const embed = new EmbedBuilder()
        .setColor(0xffcc00)
        .setTitle("No exclusive + unique cosmetics found")
        .setDescription(
          "No cosmetics from the current Exclusive + Uniques list were detected in this locker."
        );

      return interaction.editReply({ embeds: [embed] });
    }

    const buffer = await renderExclusivesCollage({
      username: interaction.user.username,
      categoryTitle: "Exclusive + Uniques",
      items: renderable,
    });

    const attachment = new AttachmentBuilder(buffer, {
      name: "locker-exclusive-uniques.png",
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`Exclusive + Uniques (${renderable.length})`)
      .setImage("attachment://locker-exclusive-uniques.png");

    return interaction.editReply({
      embeds: [embed],
      files: [attachment],
    });
  },
};
