// commands/commandlocker.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");

const { getLocker, refreshAccessToken } = require("../epic");
const { getTokens, saveTokens, saveUserLockerSnapshot } = require("../storage");

// --------------------
// Exact user-requested order
// --------------------
const CATEGORY_ORDER = [
  { key: "outfits", label: "Outfits" },
  { key: "backblings", label: "Back Blings" },
  { key: "pickaxes", label: "Pickaxes" },
  { key: "gliders", label: "Gliders" },
  { key: "emotes", label: "Emotes" },
  { key: "emoticons", label: "Emoticons" },
  { key: "sprays", label: "Sprays" },
  { key: "wraps", label: "Wraps" },
  { key: "kicks", label: "Kicks" },
  { key: "sidekicks", label: "Sidekicks" },
  { key: "contrails", label: "Contrails" },
  { key: "loading_screens", label: "Loading Screens" },
  { key: "toys", label: "Toys" },
  { key: "banners", label: "Banners" },
  { key: "musics", label: "Music Packs" },
  { key: "jam_tracks", label: "Jam Tracks" },
  { key: "jam_instruments", label: "Jam Instruments" },
  { key: "car_bodies", label: "Car Bodies" },
  { key: "car_wheels", label: "Car Wheels" },
  { key: "car_boosts", label: "Car Boosts" },
  { key: "drift_smokes", label: "Car Drift Smokes" },
  { key: "lego_building_sets", label: "LEGO® Building Sets" },
  { key: "lego_building_props", label: "LEGO® Building Props" },
];

// --------------------
// Fallback mapping from locker template prefix
// --------------------
const PREFIX_TO_CATEGORY = {
  AthenaCharacter: "outfits",
  AthenaBackpack: "backblings",
  AthenaPickaxe: "pickaxes",
  AthenaGlider: "gliders",
  AthenaDance: "emotes",
  AthenaEmoji: "emoticons",
  AthenaSpray: "sprays",
  AthenaItemWrap: "wraps",
  CosmeticShoes: "kicks",
  AthenaPet: "sidekicks",
  AthenaPetCarrier: "sidekicks",
  AthenaSkyDiveContrail: "contrails",
  AthenaLoadingScreen: "loading_screens",
  AthenaMusicPack: "musics",
  AthenaToy: "toys",
  HomebaseBannerIcon: "banners",

  SparksSong: "jam_tracks",
  SparksMicrophone: "jam_instruments",
  SparksGuitar: "jam_instruments",
  SparksBass: "jam_instruments",
  SparksKeytar: "jam_instruments",
  SparksDrums: "jam_instruments",
  SparksKeyboard: "jam_instruments",

  VehicleCosmetics_Body: "car_bodies",
  VehicleCosmetics_Skin: "car_bodies",
  VehicleCosmetics_Wheel: "car_wheels",
  VehicleCosmetics_Booster: "car_boosts",
  VehicleCosmetics_Trail: "drift_smokes",
  VehicleCosmetics_DriftTrail: "drift_smokes",

  JunoBuildingSet: "lego_building_sets",
  JunoBuildingProp: "lego_building_props",
};

// --------------------
// Primary mapping from Fortnite API cosmetic type
// --------------------
const API_TYPE_TO_CATEGORY = {
  outfit: "outfits",
  backpack: "backblings",
  pickaxe: "pickaxes",
  glider: "gliders",
  emote: "emotes",
  emoji: "emoticons",
  spray: "sprays",
  wrap: "wraps",
  shoes: "kicks",
  pet: "sidekicks",
  contrail: "contrails",
  "loading screen": "loading_screens",
  music: "musics",
  toy: "toys",
  banner: "banners",
  "banner icon": "banners",

  "jam track": "jam_tracks",
  guitar: "jam_instruments",
  bass: "jam_instruments",
  drums: "jam_instruments",
  microphone: "jam_instruments",
  keytar: "jam_instruments",
  keyboard: "jam_instruments",

  "car body": "car_bodies",
  wheel: "car_wheels",
  boost: "car_boosts",
  "drift smoke": "drift_smokes",

  "lego kit": "lego_building_sets",
  "lego decor": "lego_building_props",
};

let cosmeticsMapCache = null;
let cosmeticsMapFetchedAt = 0;
const COSMETICS_CACHE_MS = 1000 * 60 * 60 * 6;

function normalizeId(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

async function getCosmeticsMap() {
  const now = Date.now();

  if (cosmeticsMapCache && now - cosmeticsMapFetchedAt < COSMETICS_CACHE_MS) {
    return cosmeticsMapCache;
  }

  const res = await axios.get("https://fortnite-api.com/v2/cosmetics/br", {
    timeout: 30000,
  });

  const all = Array.isArray(res.data?.data) ? res.data.data : [];
  const map = new Map();

  for (const cosmetic of all) {
    if (!cosmetic?.id) continue;
    map.set(normalizeId(cosmetic.id), cosmetic);
  }

  cosmeticsMapCache = map;
  cosmeticsMapFetchedAt = now;
  return map;
}

function getBestImage(cosmetic) {
  return (
    cosmetic?.images?.smallIcon ||
    cosmetic?.images?.icon ||
    cosmetic?.images?.featured ||
    cosmetic?.images?.small ||
    null
  );
}

function getBestRarity(cosmetic) {
  return (
    cosmetic?.series?.value ||
    cosmetic?.series?.id ||
    cosmetic?.rarity?.value ||
    cosmetic?.rarity?.id ||
    "common"
  );
}

function getCategoryFromApiCosmetic(cosmetic) {
  const typeCandidates = [
    cosmetic?.type?.value,
    cosmetic?.type?.displayValue,
    cosmetic?.type?.backendValue,
    cosmetic?.gameplayTags?.find((tag) =>
      String(tag).toLowerCase().startsWith("cosmetic.itemtype.")
    ),
  ]
    .filter(Boolean)
    .map((x) => normalizeText(x));

  for (const candidate of typeCandidates) {
    if (API_TYPE_TO_CATEGORY[candidate]) {
      return API_TYPE_TO_CATEGORY[candidate];
    }

    if (candidate.startsWith("cosmetic.itemtype.")) {
      const raw = candidate
        .replace("cosmetic.itemtype.", "")
        .replace(/_/g, " ");
      if (API_TYPE_TO_CATEGORY[raw]) return API_TYPE_TO_CATEGORY[raw];
    }
  }

  return null;
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

function buildSnapshotForStats(itemsWithPrefix) {
  const cosmetics = {};

  for (const item of itemsWithPrefix || []) {
    const cosmeticIdLower = String(item?.idPart || "").toLowerCase();
    if (!cosmeticIdLower) continue;

    const variants = {};
    const active = {};
    const rawVariants = Array.isArray(item?.attributes?.variants)
      ? item.attributes.variants
      : [];

    for (const v of rawVariants) {
      const channel = String(v?.channel || "").toLowerCase();
      if (!channel) continue;

      let owned =
        (Array.isArray(v.owned) && v.owned) ||
        (Array.isArray(v.ownedVariants) && v.ownedVariants) ||
        (Array.isArray(v.ownedTags) && v.ownedTags) ||
        (Array.isArray(v.tags) && v.tags) ||
        [];

      owned = owned.map((x) => String(x)).filter(Boolean);

      const act = v?.active ?? v?.selected ?? v?.value ?? v?.tag ?? null;

      if (act != null && String(act).length) {
        active[channel] = String(act);
      }

      if (!owned.length && act != null && String(act).length) {
        owned = [String(act)];
      }

      if (act != null && String(act).length && !owned.includes(String(act))) {
        owned.push(String(act));
      }

      if (owned.length) {
        variants[channel] = [...new Set(owned.map((x) => String(x)))];
      }
    }

    cosmetics[cosmeticIdLower] = {
      variants,
      active,
      rawVariants,
    };
  }

  return { cosmetics };
}

function sortResolvedItemsAlphabetically(items) {
  return [...items].sort((a, b) => {
    const aName = String(a?.name || a?.id || "").toLowerCase();
    const bName = String(b?.name || b?.id || "").toLowerCase();
    return aName.localeCompare(bName);
  });
}

async function resolveCategories(itemsWithPrefix) {
  const cosmeticsMap = await getCosmeticsMap();

  const resolved = {};
  for (const category of CATEGORY_ORDER) resolved[category.key] = [];

  for (const item of itemsWithPrefix) {
    const cosmetic = cosmeticsMap.get(normalizeId(item.idPart));

    let categoryKey =
      getCategoryFromApiCosmetic(cosmetic) ||
      PREFIX_TO_CATEGORY[item.prefix] ||
      null;

    if (!categoryKey) continue;
    if (!resolved[categoryKey]) resolved[categoryKey] = [];

    resolved[categoryKey].push({
      id: cosmetic?.id || item.idPart,
      name: cosmetic?.name || item.idPart,
      iconUrl: getBestImage(cosmetic),
      rarity: getBestRarity(cosmetic),
      category: categoryKey,
      prefix: item.prefix,
      idPart: item.idPart,
      guid: item.guid,
      attributes: item.attributes || {},
    });
  }

  for (const key of Object.keys(resolved)) {
    resolved[key] = sortResolvedItemsAlphabetically(resolved[key]);
  }

  return resolved;
}

function buildCategoriesInFixedOrder(resolvedCategories) {
  return CATEGORY_ORDER.map((c) => ({
    key: c.key,
    label: c.label,
    count: Array.isArray(resolvedCategories[c.key])
      ? resolvedCategories[c.key].length
      : 0,
  })).filter((c) => c.count > 0);
}

function buildCategoryPicker(discordUserId, categories, page = 0) {
  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(categories.length / pageSize));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = categories.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("Pick a category")
    .setFooter({ text: `Page ${safePage + 1}/${totalPages}` });

  const rows = [];

  for (let i = 0; i < slice.length; i += 2) {
    const row = new ActionRowBuilder();

    slice.slice(i, i + 2).forEach((c) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`locker_cat:${c.key}:${discordUserId}`)
          .setLabel(`${c.label} (${c.count})`)
          .setStyle(ButtonStyle.Secondary)
      );
    });

    rows.push(row);
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`locker_catpage:${safePage - 1}:${discordUserId}`)
        .setLabel("◀")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage === 0),
      new ButtonBuilder()
        .setCustomId(`locker_catpage:${safePage + 1}:${discordUserId}`)
        .setLabel("▶")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage >= totalPages - 1)
    )
  );

  return { embeds: [embed], components: rows };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("locker")
    .setDescription("Fetch your Fortnite locker"),

  async execute(interaction) {
    await interaction.deferReply();

    const discordId = interaction.user.id;
    let tokens = await getTokens(discordId);

    if (!tokens?.accessToken || !tokens?.accountId) {
      const embed = new EmbedBuilder()
        .setColor(0xff3b30)
        .setTitle("❌ Not Logged In")
        .setDescription(
          "You need to link your Epic Games account first!\n\nUse **/login** to get started."
        );

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

      if (
        (e?.code === "TOKEN_EXPIRED" ||
          String(msg).toLowerCase().includes("expired") ||
          e?.response?.status === 401) &&
        tokens?.refreshToken
      ) {
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
      } else {
        return interaction.editReply(`❌ Error fetching locker: ${msg}`);
      }
    }

    const itemsWithPrefix = extractItemsWithPrefix(lockerData);
    const snapshot = buildSnapshotForStats(itemsWithPrefix);
    await saveUserLockerSnapshot(discordId, snapshot);

    const resolvedCategories = await resolveCategories(itemsWithPrefix);
    const categories = buildCategoriesInFixedOrder(resolvedCategories);

    interaction.client.lockerCache ??= new Map();
    interaction.client.lockerCache.set(discordId, {
      lockerData,
      itemsWithPrefix,
      resolvedCategories,
      categories,
      savedAt: Date.now(),
    });

    if (!categories.length) {
      const embed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle("✅ Locker Updated")
        .setDescription("Your locker was fetched, but no supported locker categories were found.");

      return interaction.editReply({ embeds: [embed] });
    }

    const view = buildCategoryPicker(discordId, categories, 0);
    return interaction.editReply(view);
  },
};
