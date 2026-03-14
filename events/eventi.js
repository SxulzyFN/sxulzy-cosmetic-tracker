// events/eventi.js
const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const { saveTokens } = require("../storage");
const { getAccessToken } = require("../epic");
const { renderLockerCollage } = require("../utils/renderLockerCollage");

const PAGE_SIZE = 8;

const CATEGORY_META = {
  outfits: { label: "Outfits" },
  backblings: { label: "Back Blings" },
  pickaxes: { label: "Pickaxes" },
  gliders: { label: "Gliders" },
  emotes: { label: "Emotes" },
  sprays: { label: "Sprays" },
  emoticons: { label: "Emoticons" },
  wraps: { label: "Wraps" },
  loading_screens: { label: "Loading Screens" },
  contrails: { label: "Contrails" },
  toys: { label: "Toys" },
  banners: { label: "Banners" },
  musics: { label: "Music Packs" },
  kicks: { label: "Kicks" },
  sidekicks: { label: "Sidekicks" },
  jam_tracks: { label: "Jam Tracks" },
  jam_instruments: { label: "Jam Instruments" },
  car_bodies: { label: "Car Bodies" },
  car_wheels: { label: "Car Wheels" },
  car_boosts: { label: "Car Boosts" },
  drift_smokes: { label: "Car Drift Smokes" },
  lego_building_sets: { label: "LEGO Building Sets" },
  lego_building_props: { label: "LEGO Building Props" },
};

function buildCategoryPicker(discordUserId, categories, page = 0) {
  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE));
  const safePage = Math.max(0, Math.min(page, totalPages - 1));
  const slice = categories.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE
  );

  const embed = new EmbedBuilder()
    .setColor(0x2b2d31)
    .setTitle("Pick a category")
    .setFooter({ text: `Page ${safePage + 1}/${totalPages}` });

  const rows = [];

  for (let i = 0; i < slice.length; i += 2) {
    const row = new ActionRowBuilder();

    for (const c of slice.slice(i, i + 2)) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`locker_cat:${c.key}:${discordUserId}`)
          .setLabel(`${c.label} (${c.count})`)
          .setStyle(ButtonStyle.Secondary)
      );
    }

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

  return {
    embeds: [embed],
    components: rows,
  };
}

module.exports = {
  name: Events.InteractionCreate,
  once: false,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        return await command.execute(interaction);
      }

      if (interaction.isButton()) {
        if (interaction.customId === "enter_auth_code") {
          const modal = new ModalBuilder()
            .setCustomId("auth_code_modal")
            .setTitle("Enter Authorization Code");

          const codeInput = new TextInputBuilder()
            .setCustomId("auth_code")
            .setLabel("Paste Epic authorization code")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder("Paste the code from the Epic redirect URL");

          const row = new ActionRowBuilder().addComponents(codeInput);
          modal.addComponents(row);

          return await interaction.showModal(modal);
        }

        const customId = String(interaction.customId || "");
        const parts = customId.split(":");
        const action = parts[0];
        const value = parts[1];
        const ownerId = parts[2];

        if (!action.startsWith("locker_")) return;

        if (ownerId && ownerId !== interaction.user.id) {
          return await interaction.reply({
            content: "❌ That locker menu belongs to another user.",
            ephemeral: true,
          });
        }

        const cache = interaction.client.lockerCache?.get(interaction.user.id);
        if (!cache) {
          return await interaction.reply({
            content: "❌ Locker cache expired. Please run **/locker** again.",
            ephemeral: true,
          });
        }

        if (action === "locker_catpage") {
          await interaction.deferUpdate();

          const page = Number.parseInt(value, 10) || 0;
          const view = buildCategoryPicker(
            interaction.user.id,
            cache.categories || [],
            page
          );

          return await interaction.editReply(view);
        }

        if (action === "locker_cat") {
          const categoryKey = value;
          const label = CATEGORY_META[categoryKey]?.label || categoryKey;

          const categoryItems = Array.isArray(cache.resolvedCategories?.[categoryKey])
            ? cache.resolvedCategories[categoryKey]
            : [];

          if (!categoryItems.length) {
            return await interaction.reply({
              content: `❌ No items found for **${label}**.`,
              ephemeral: true,
            });
          }

          await interaction.deferReply();

          const imageBuffer = await renderLockerCollage({
            username: interaction.user.username,
            categoryTitle: label,
            items: categoryItems,
          });

          const safeName = categoryKey.replace(/[^a-z0-9_-]/gi, "_");
          const imageName = `locker-${safeName}-${Date.now()}.png`;

          const attachment = new AttachmentBuilder(imageBuffer, {
            name: imageName,
          });

          const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`${label} (${categoryItems.length})`)
            .setImage(`attachment://${imageName}`);

          return await interaction.editReply({
            embeds: [embed],
            files: [attachment],
          });
        }

        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === "auth_code_modal") {
          await interaction.deferReply({ ephemeral: true });

          const authCode = interaction.fields.getTextInputValue("auth_code")?.trim();

          if (!authCode) {
            return await interaction.editReply("❌ No authorization code provided.");
          }

          const tokenData = await getAccessToken(authCode);

          const savedTokens = {
            accessToken: tokenData.accessToken,
            refreshToken: tokenData.refreshToken,
            accountId: tokenData.accountId,
            expiresIn: tokenData.expiresIn,
            createdAt: Date.now(),
          };

          await saveTokens(interaction.user.id, savedTokens);

          const embed = new EmbedBuilder()
            .setColor(0x2ecc71)
            .setTitle("✅ Epic account linked")
            .setDescription(
              "Your Epic Games account has been linked successfully.\n\nYou can now use **/locker** and **/lockerexclusives**."
            );

          return await interaction.editReply({
            embeds: [embed],
          });
        }

        return;
      }
    } catch (error) {
      console.error("InteractionCreate error:", error);

      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({
            content: `❌ Error: ${error.message || "Unknown error"}`,
          });
        } else {
          await interaction.reply({
            content: `❌ Error: ${error.message || "Unknown error"}`,
            ephemeral: true,
          });
        }
      } catch (replyError) {
        console.error("Failed to send interaction error reply:", replyError);
      }
    }
  },
};