// utils/cosmeticLookup.js

const axios = require("axios");

const COSMETICS_URL = "https://fortnite-api.com/v2/cosmetics/br";
const CACHE_MS = 1000 * 60 * 60 * 6;

let cachedAt = 0;
let cosmetics = [];
let cosmeticsById = new Map();

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

async function loadCosmetics() {
  const now = Date.now();

  if (cosmetics.length && now - cachedAt < CACHE_MS) {
    return cosmetics;
  }

  const res = await axios.get(COSMETICS_URL, { timeout: 30000 });
  const list = Array.isArray(res.data?.data) ? res.data.data : [];

  cosmetics = list;
  cosmeticsById = new Map();

  for (const cosmetic of list) {
    if (cosmetic?.id) {
      cosmeticsById.set(normalize(cosmetic.id), cosmetic);
    }
  }

  cachedAt = now;
  return cosmetics;
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

function getBestType(cosmetic) {
  return (
    cosmetic?.type?.displayValue ||
    cosmetic?.type?.value ||
    cosmetic?.type?.backendValue ||
    "Unknown"
  );
}

function getBestRarity(cosmetic) {
  return (
    cosmetic?.series?.value ||
    cosmetic?.series?.id ||
    cosmetic?.rarity?.displayValue ||
    cosmetic?.rarity?.value ||
    cosmetic?.rarity?.id ||
    "Unknown"
  );
}

async function findCosmetic(query) {
  await loadCosmetics();

  const q = normalize(query);
  if (!q) return null;

  if (cosmeticsById.has(q)) {
    return cosmeticsById.get(q);
  }

  const exactName = cosmetics.find((c) => normalize(c?.name) === q);
  if (exactName) return exactName;

  const exactSearchTags = cosmetics.find((c) =>
    Array.isArray(c?.searchTags) &&
    c.searchTags.some((tag) => normalize(tag) === q)
  );
  if (exactSearchTags) return exactSearchTags;

  const partialName = cosmetics.find((c) => normalize(c?.name).includes(q));
  if (partialName) return partialName;

  const partialId = cosmetics.find((c) => normalize(c?.id).includes(q));
  if (partialId) return partialId;

  return null;
}

module.exports = {
  normalize,
  findCosmetic,
  getBestImage,
  getBestType,
  getBestRarity,
};