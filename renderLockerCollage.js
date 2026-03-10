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

const FONT_5X7 = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10011", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  1: ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "_": ["00000", "00000", "00000", "00000", "00000", "00000", "11111"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "00110", "00110", "01100"],
  "'": ["00100", "00100", "00100", "00000", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "/": ["00001", "00010", "00100", "01000", "10000", "00000", "00000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["00100", "01010", "00100", "01011", "10010", "10010", "01101"],
  "®": ["01110", "10001", "10111", "10101", "10111", "10000", "01110"],
  "©": ["01110", "10001", "10111", "10111", "10111", "10001", "01110"],
  "…": ["00000", "00000", "00000", "00000", "00000", "01010", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
};

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
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
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (!clean) return ["", ""];

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

function bitmapTextSvg(text, options = {}) {
  const {
    scale = 2,
    color = "#ffffff",
    center = false,
    width = null,
    letterSpacing = 1,
    lineHeight = 2,
  } = options;

  const lines = String(text || "")
    .toUpperCase()
    .split("\n");

  const charW = 5 * scale;
  const charH = 7 * scale;
  const gap = letterSpacing * scale;

  const lineWidths = lines.map((line) =>
    Math.max(
      0,
      line.split("").length * charW +
        Math.max(0, line.split("").length - 1) * gap
    )
  );

  const svgWidth = width || Math.max(1, ...lineWidths);
  const svgHeight =
    lines.length * charH + Math.max(0, lines.length - 1) * lineHeight * scale;

  const rects = [];

  lines.forEach((line, lineIndex) => {
    const chars = line.split("");
    const fullLineWidth =
      chars.length * charW + Math.max(0, chars.length - 1) * gap;

    let xCursor = center ? Math.floor((svgWidth - fullLineWidth) / 2) : 0;
    const yBase = lineIndex * (charH + lineHeight * scale);

    for (const ch of chars) {
      const glyph = FONT_5X7[ch] || FONT_5X7["?"];

      for (let y = 0; y < glyph.length; y++) {
        for (let x = 0; x < glyph[y].length; x++) {
          if (glyph[y][x] === "1") {
            rects.push(
              `<rect x="${xCursor + x * scale}" y="${yBase + y * scale}" width="${scale}" height="${scale}" fill="${color}"/>`
            );
          }
        }
      }

      xCursor += charW + gap;
    }
  });

  return Buffer.from(`
    <svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
      ${rects.join("")}
    </svg>
  `);
}

async function renderLockerCollage({ username, categoryTitle, title, items }) {
  const resolvedTitle = String(categoryTitle || title || "Locker");
  const resolvedUsername = String(username || "Unknown");
  const safe = (items || []).filter((i) => i && i.iconUrl).slice(0, 1500);

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
    <svg width="${width}" height="${height}">
      <rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="${cardW}" height="${cardH}" rx="28" ry="28" fill="#12121c"/>
      <rect x="${OUTER_PAD}" y="${OUTER_PAD}" width="8" height="${cardH}" rx="4" ry="4" fill="#5b6cff"/>
      <rect x="${gridLeft - 10}" y="${gridTop - 10}" width="${gridW + 20}" height="${gridH + 20}" rx="${GRID_BG_RADIUS}" ry="${GRID_BG_RADIUS}" fill="#050505"/>
    </svg>
  `);

  const titleBuf = bitmapTextSvg(`${resolvedTitle} (${safe.length})`, {
    scale: 4,
    color: "#ffffff",
  });

  const submittedBuf = bitmapTextSvg(`SUBMITTED BY ${resolvedUsername}`, {
    scale: 2,
    color: "#ffffff",
  });

  img = img.composite([
    { input: cardSvg, left: 0, top: 0 },
    { input: titleBuf, left: OUTER_PAD + 38, top: OUTER_PAD + 26 },
    { input: submittedBuf, left: OUTER_PAD + 38, top: height - OUTER_PAD - 32 },
  ]);

  const iconBuffers = await Promise.all(
    safe.map(async (it) => {
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

    const [l1, l2] = wrapTwoLines(safe[i].name, 14);

    const labelSvg = bitmapTextSvg(`${l1}\n${l2}`, {
      scale: 1,
      color: "#ffffff",
      center: true,
      width: TILE_W,
      lineHeight: 1,
      letterSpacing: 1,
    });

    composites.push({ input: labelSvg, left, top: top + ICON + 4 });
  }

  img = img.composite(composites);
  return img.png({ compressionLevel: 9 }).toBuffer();
}

module.exports = { renderLockerCollage };