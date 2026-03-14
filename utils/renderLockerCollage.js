// utils/renderLockerCollage.js
const sharp = require("sharp");
const axios = require("axios");

const RARITY_BG = {
  common: { r: 135, g: 140, b: 150, alpha: 1 },
  uncommon: { r: 90, g: 190, b: 70, alpha: 1 },
  rare: { r: 65, g: 145, b: 255, alpha: 1 },
  epic: { r: 170, g: 90, b: 255, alpha: 1 },
  legendary: { r: 255, g: 145, b: 50, alpha: 1 },
  mythic: { r: 255, g: 210, b: 70, alpha: 1 },
  icon: { r: 60, g: 210, b: 230, alpha: 1 },
  marvel: { r: 220, g: 45, b: 45, alpha: 1 },
  dc: { r: 65, g: 105, b: 255, alpha: 1 },
  starwars: { r: 85, g: 85, b: 85, alpha: 1 },
  shadow: { r: 80, g: 80, b: 90, alpha: 1 },
  slurp: { r: 40, g: 180, b: 210, alpha: 1 },
  frozen: { r: 120, g: 210, b: 255, alpha: 1 },
  lava: { r: 255, g: 95, b: 45, alpha: 1 },
  gaminglegends: { r: 120, g: 85, b: 255, alpha: 1 },
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cleanText(value) {
  const cleaned = String(value || "")
    .replace(/[^\x20-\x7E®©’‘“”–—…]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || "Unknown";
}

async function fetchBuffer(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  return Buffer.from(res.data);
}

function rarityKey(rarityValue) {
  const r = String(rarityValue || "").toLowerCase().trim();
  if (RARITY_BG[r]) return r;
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
  if (r.includes("legendary")) return "legendary";
  if (r.includes("epic")) return "epic";
  if (r.includes("rare")) return "rare";
  if (r.includes("uncommon")) return "uncommon";
  return "common";
}

function wrapTwoLines(text, maxCharsPerLine = 14) {
  const clean = cleanText(text);
  if (!clean) return ["Unknown", ""];

  const words = clean.split(" ");
  const lines = ["", ""];
  let line = 0;

  for (const w of words) {
    const next = lines[line] ? `${lines[line]} ${w}` : w;

    if (next.length <= maxCharsPerLine) {
      lines[line] = next;
      continue;
    }

    if (line === 0) {
      line = 1;
      lines[line] =
        w.length <= maxCharsPerLine
          ? w
          : `${w.slice(0, Math.max(1, maxCharsPerLine - 1))}…`;
      continue;
    }

    const base = lines[1] || "";
    lines[1] = !base
      ? `${w.slice(0, Math.max(1, maxCharsPerLine - 1))}…`
      : `${base.slice(0, Math.max(1, maxCharsPerLine - 1))}…`;
    return lines;
  }

  if (lines[1].length > maxCharsPerLine) {
    lines[1] = `${lines[1].slice(0, Math.max(1, maxCharsPerLine - 1))}…`;
  }

  return lines;
}

function chooseColumnCount(itemCount) {
  if (itemCount >= 900) return 28;
  if (itemCount >= 700) return 26;
  if (itemCount >= 500) return 24;
  if (itemCount >= 300) return 22;
  if (itemCount >= 180) return 20;
  if (itemCount >= 100) return 18;
  if (itemCount >= 50) return 16;
  return Math.max(8, Math.min(14, itemCount || 8));
}

function makeTextSvg({
  width,
  height,
  text,
  fontSize = 12,
  weight = 700,
  align = "left",
  color = "#ffffff",
}) {
  const safeText = esc(cleanText(text));
  const anchor = align === "center" ? "middle" : "start";
  const x = align === "center" ? Math.floor(width / 2) : 0;

  return Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          fill: ${color};
          font-size: ${fontSize}px;
          font-weight: ${weight};
          font-family: DejaVu Sans, Arial, sans-serif;
        }
      </style>
      <text x="${x}" y="${Math.floor(height * 0.8)}" text-anchor="${anchor}">${safeText}</text>
    </svg>
  `);
}

async function renderLockerCollage({ username, categoryTitle, title, items }) {
  const resolvedTitle = String(categoryTitle || title || "Locker");
  const resolvedUsername = String(username || "Unknown");
  const safe = (items || []).filter(Boolean).slice(0, 1500);

  const ICON = 92;
  const TEXT_H = 24;
  const TILE_W = 96;
  const TILE_H = ICON + TEXT_H;
  const PAD = 3;

  const OUTER_PAD = 24;
  const HEADER_H = 110;
  const FOOTER_H = 70;
  const CARD_PAD = 22;
  const GRID_TOP_GAP = 12;
  const GRID_BOTTOM_GAP = 18;
  const GRID_BG_RADIUS = 28;

  const COLS = chooseColumnCount(safe.length || (items?.length || 0));
  const rows = Math.max(1, Math.ceil(safe.length / COLS));

  const gridW = COLS * TILE_W + Math.max(0, COLS - 1) * PAD;
  const gridH = rows * TILE_H + Math.max(0, rows - 1) * PAD;

  const cardW = gridW + CARD_PAD * 2;
  const cardH = HEADER_H + GRID_TOP_GAP + gridH + GRID_BOTTOM_GAP + FOOTER_H;

  const width = cardW + OUTER_PAD * 2;
  const height = cardH + OUTER_PAD * 2;

  const gridLeft = OUTER_PAD + CARD_PAD;
  const gridTop = OUTER_PAD + HEADER_H + GRID_TOP_GAP;

  let img = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 8, g: 8, b: 8, alpha: 1 },
    },
  });

  const cardSvg = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="${cardW}" height="${cardH}" rx="28" ry="28" fill="#12121c"/>
      <rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="8" height="${cardH}" rx="4" ry="4" fill="#5b6cff"/>
      <rect x="${gridLeft - 10}" y="${gridTop - 10}" width="${gridW + 20}" height="${gridH + 20}" rx="${GRID_BG_RADIUS}" ry="${GRID_BG_RADIUS}" fill="#050505"/>
    </svg>
  `);

  const titleBuf = makeTextSvg({
    width: cardW - 60,
    height: 44,
    text: `${resolvedTitle} (${safe.length})`,
    fontSize: 32,
    weight: 800,
    align: "left",
  });

  const submittedBuf = makeTextSvg({
    width: cardW - 60,
    height: 24,
    text: `Submitted by ${resolvedUsername}`,
    fontSize: 18,
    weight: 700,
    align: "left",
  });

  img = img.composite([
    { input: cardSvg, left: 0, top: 0 },
    { input: titleBuf, left: OUTER_PAD + 38, top: OUTER_PAD + 18 },
    { input: submittedBuf, left: OUTER_PAD + 38, top: height - OUTER_PAD - 34 },
  ]);

  const iconBuffers = await Promise.all(
    safe.map(async (it) => {
      if (!it?.iconUrl) return null;
      try {
        return await fetchBuffer(it.iconUrl);
      } catch {
        return null;
      }
    })
  );

  const composites = [];

  for (let i = 0; i < safe.length; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    const left = gridLeft + col * (TILE_W + PAD);
    const top = gridTop + row * (TILE_H + PAD);

    const rarity = rarityKey(safe[i].rarity);
    const bg = RARITY_BG[rarity] || RARITY_BG.common;

    const tile = await sharp({
      create: {
        width: TILE_W,
        height: TILE_H,
        channels: 4,
        background: bg,
      },
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: TILE_W,
              height: TEXT_H,
              channels: 4,
              background: { r: 0, g: 0, b: 0, alpha: 0.58 },
            },
          }).png().toBuffer(),
          left: 0,
          top: ICON,
        },
      ])
      .png()
      .toBuffer();

    composites.push({ input: tile, left, top });

    const iconBuf = iconBuffers[i];
    if (iconBuf) {
      try {
        const resized = await sharp(iconBuf)
          .resize(ICON, ICON, { fit: "cover" })
          .png()
          .toBuffer();

        composites.push({ input: resized, left: left + 2, top });
      } catch {}
    }

    const displayName =
      safe[i].name ||
      safe[i].id ||
      safe[i].idPart ||
      safe[i].cosmeticId ||
      "Unknown";

    const [l1, l2] = wrapTwoLines(displayName, 14);

    const label1 = makeTextSvg({
      width: TILE_W,
      height: 10,
      text: l1,
      fontSize: 10,
      weight: 800,
      align: "center",
    });

    const label2 = makeTextSvg({
      width: TILE_W,
      height: 10,
      text: l2,
      fontSize: 10,
      weight: 800,
      align: "center",
    });

    composites.push({ input: label1, left, top: top + ICON + 1 });
    composites.push({ input: label2, left, top: top + ICON + 12 });
  }

  img = img.composite(composites);
  return img.png({ compressionLevel: 9 }).toBuffer();
}

module.exports = { renderLockerCollage };
