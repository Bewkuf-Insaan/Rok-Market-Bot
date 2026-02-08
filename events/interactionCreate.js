const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const Draft = require("../models/Draft");
const { startSellerDraft } = require("../services/sellerFlow");
const { checkSubscription } = require("../services/subscriptionService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    /* =====================================================
       SLASH COMMANDS
    ===================================================== */
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        if (
          interaction.guild &&
          interaction.commandName !== "addsub" &&
          interaction.commandName !== "setup"
        ) {
          const validSub = await checkSubscription(interaction.guild.id);
          if (!validSub) {
            return interaction.reply({
              content: "❌ This server does not have an active subscription.",
              flags: 64
            });
          }
        }

        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "❌ Command error.",
          flags: 64
        });
      }
      return;
    }

    /* =====================================================
       BUTTONS
    ===================================================== */
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    /* =====================================================
       LOCATION RULES (CRITICAL FIX)
    ===================================================== */

    const dmAllowed =
      id.startsWith("sell_") ||
      id.startsWith("buytype_");

    const serverOnly =
      id === "seller" ||
      id === "buyer" ||
      /^buy_\d+$/.test(id); // only real buy buttons

    if (!interaction.guild && serverOnly && !dmAllowed) {
      return interaction.reply({
        content: "❌ Please use this button inside the server.",
        flags: 64
      });
    }

    /* =====================================================
       SELLER START (SERVER)
    ===================================================== */
    if (id === "seller") {
      await startSellerDraft(interaction.user.id, interaction.guild.id);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("sell_account").setLabel("🧑‍💼 Account").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("sell_resources").setLabel("🌾 Resources").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("sell_kingdom").setLabel("🏰 Kingdom").setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ content: "📩 Check your DMs.", flags: 64 });

      await interaction.user.send({
        content: "**What do you want to sell?**",
        components: [row]
      });
      return;
    }

    /* =====================================================
       SELL TYPE (DM)
    ===================================================== */
    if (id.startsWith("sell_")) {
      await interaction.deferReply({ flags: 64 });

      const draft = await Draft.findOne({ userId: interaction.user.id });
      if (!draft) return interaction.editReply("❌ Seller session expired.");

      draft.sellType = id.replace("sell_", "");
      draft.step = 1;
      draft.data = {};
      await draft.save();

      const firstQuestion = {
        account: "Account Season Tag:",
        resources: "🌾 Enter Food amount:",
        kingdom: "Season (e.g. SOC / KVK1):"
      };

      await interaction.user.send(firstQuestion[draft.sellType]);
      return interaction.editReply("✅ Answer in DM.");
    }

    /* =====================================================
       BUYER START (SERVER)
    ===================================================== */
    if (id === "buyer") {

      let draft = await Draft.findOne({ userId: interaction.user.id });

      if (!draft) {
        draft = await Draft.create({
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          role: "buyer",
          step: 0,
          data: {}
        });
      } else {
        draft.role = "buyer";
        draft.guildId = interaction.guild.id;
        draft.step = 0;
        draft.buyType = null;
        draft.data = {};
        await draft.save();
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("buytype_account").setLabel("🧑‍💼 Account").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("buytype_resources").setLabel("🌾 Resources").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("buytype_kingdom").setLabel("🏰 Kingdom").setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ content: "📩 Check your DMs.", flags: 64 });

      await interaction.user.send({
        content: "**What do you want to buy?**",
        components: [row]
      });
      return;
    }

    /* =====================================================
       BUY TYPE (DM) — FIXED
    ===================================================== */
    if (id.startsWith("buytype_")) {
      await interaction.deferReply({ flags: 64 });

      const draft = await Draft.findOne({ userId: interaction.user.id });
      if (!draft || draft.role !== "buyer") {
        return interaction.editReply("❌ Buyer session expired.");
      }

      draft.buyType = id.replace("buytype_", "");
      draft.step = 1;
      await draft.save();

      await interaction.user.send(
        `✅ You chose **${draft.buyType.toUpperCase()}**.\n\n` +
        "💰 Enter your budget in USD (numbers only):"
      );

      return interaction.editReply("📩 Check your DMs.");
    }

    /* =====================================================
       BUY NOW (SERVER)
    ===================================================== */
    if (/^buy_\d+$/.test(id)) {
      await interaction.deferReply({ flags: 64 });

      try {
        const listingId = parseInt(id.split("_")[1]);
        const Listing = require("../models/Listing");
        const Guild = require("../models/Guild");
        const Deal = require("../models/Deal");
        const mmList = require("../config/mmList");

        const listing = await Listing.findOne({ listingId });
        if (!listing || listing.status !== "available")
          return interaction.editReply("❌ Listing not available.");

        const guildConfig = await Guild.findOne({ guildId: listing.guildId });
        const guild = await client.guilds.fetch(listing.guildId);
        const mm = mmList[listing.mmName];
        if (!mm) return interaction.editReply("❌ MM config error.");

        listing.status = "in_deal";
        await listing.save();

        const ticket = await guild.channels.create({
          name: `deal-${listingId}`,
          type: ChannelType.GuildText,
          parent: guildConfig.ticketCategoryId,
          permissionOverwrites: [
            { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
            { id: listing.sellerId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
            { id: mm.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
          ]
        });

        await ticket.send(
          `🛡 **Deal Started**\n\n` +
          `Buyer: <@${interaction.user.id}>\n` +
          `Seller: <@${listing.sellerId}>\n` +
          `MM: <@${mm.id}>`
        );

        await Deal.create({
          listingId,
          guildId: listing.guildId,
          channelId: ticket.id,
          buyerId: interaction.user.id,
          sellerId: listing.sellerId,
          mmId: mm.id,
          status: "waiting_payment"
        });

        return interaction.editReply(`✅ Deal ticket created: ${ticket}`);
      } catch (err) {
        console.error(err);
        return interaction.editReply("⚠ Failed to start deal.");
      }
    }
  }
};
