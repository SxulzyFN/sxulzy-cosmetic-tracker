// events/eventRareOwnersBoard.js
const { Events, ChannelType, EmbedBuilder } = require("discord.js");
const { buildRareOwnersBoard } = require("../utils/rareownersboard");

const CHANNEL_NAME = "rare-owners";
const UPDATE_INTERVAL_MS = 10 * 60 * 1000;
const MESSAGE_MARKER = "RARE_OWNERS_BOARD_V1";

let started = false;

function chunkLines(lines, maxLen = 3900) {
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length > maxLen) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function buildEmbeds(board) {
  const tracked = board.trackedLockers || 0;
  const rows = Array.isArray(board.rows) ? board.rows : [];

  const lines = rows.map((row, index) => {
    return `**${index + 1}. ${row.label}** — ${row.owners}/${tracked}`;
  });

  const chunks = chunkLines(lines.length ? lines : ["No tracked cosmetics found."]);
  const embeds = chunks.slice(0, 10).map((chunk, index) => {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(index === 0 ? "Rare Owners Board" : `Rare Owners Board (Page ${index + 1})`)
      .setDescription(chunk)
      .setFooter({
        text:
          index === 0
            ? `Tracked lockers: ${tracked} • Uses role sync cosmetic list`
            : `Tracked lockers: ${tracked}`,
      })
      .setTimestamp();

    return embed;
  });

  return embeds;
}

async function findBoardMessage(channel) {
  const messages = await channel.messages.fetch({ limit: 20 }).catch(() => null);
  if (!messages) return null;

  return (
    messages.find(
      (msg) =>
        msg.author?.id === channel.client.user.id &&
        typeof msg.content === "string" &&
        msg.content.includes(MESSAGE_MARKER)
    ) || null
  );
}

async function updateRareOwnersChannel(channel) {
  const board = await buildRareOwnersBoard();
  const embeds = buildEmbeds(board);

  const existing = await findBoardMessage(channel);

  const payload = {
    content: MESSAGE_MARKER,
    embeds,
  };

  if (existing) {
    await existing.edit(payload).catch((err) => {
      console.error(`Failed to edit rare owners board in #${channel.name}:`, err);
    });
    return;
  }

  await channel.send(payload).catch((err) => {
    console.error(`Failed to send rare owners board in #${channel.name}:`, err);
  });
}

async function updateAllRareOwnersChannels(client) {
  const guilds = [...client.guilds.cache.values()];

  for (const guild of guilds) {
    try {
      const channel =
        guild.channels.cache.find(
          (ch) =>
            ch.type === ChannelType.GuildText &&
            ch.name.toLowerCase() === CHANNEL_NAME
        ) || null;

      if (!channel) continue;

      await updateRareOwnersChannel(channel);
    } catch (err) {
      console.error(`Rare owners update failed for guild ${guild.id}:`, err);
    }
  }
}

module.exports = {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    if (started) return;
    started = true;

    console.log("Rare owners board updater started");

    await updateAllRareOwnersChannels(client).catch((err) => {
      console.error("Initial rare owners update failed:", err);
    });

    setInterval(async () => {
      await updateAllRareOwnersChannels(client).catch((err) => {
        console.error("Scheduled rare owners update failed:", err);
      });
    }, UPDATE_INTERVAL_MS);
  },
};