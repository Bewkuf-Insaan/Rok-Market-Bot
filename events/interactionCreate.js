const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const Draft = require("../models/Draft");
const { startSellerDraft } = require("../services/sellerFlow");
const { checkSubscription } = require("../services/subscriptionService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    // ==============================
    // SLASH COMMANDS
    // ==============================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        if (interaction.guild) {
          if (
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
        }

        await command.execute(interaction, client);

      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error executing this command.",
            flags: 64
          });
        } else {
          await interaction.reply({
            content: "There was an error executing this command.",
            flags: 64
          });
        }
      }
      return;
    }

    // ==============================
    // BUTTONS
    // ==============================
    if (!interaction.isButton()) return;

    // ✅ Allow seller + buyer type buttons in DM
    const isSellerType = interaction.customId.startsWith("sell_");
    const isBuyerType = interaction.customId.startsWith("buytype_");

    if (!interaction.guild && !isSellerType && !isBuyerType) {
      return interaction.reply({
        content: "Please use this button inside the server.",
        flags: 64
      });
    }

    // =========================
    // SELLER BUTTON (SERVER)
    // =========================
    if (interaction.customId === "seller") {

      await startSellerDraft(interaction.user.id, interaction.guild.id);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("sell_account")
          .setLabel("🧑‍💼 Account")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("sell_resources")
          .setLabel("🌾 Resources")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("sell_kingdom")
          .setLabel("🏰 Kingdom")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: "📩 Check your DMs to continue seller setup.",
        flags: 64
      });

      await interaction.user.send({
        content: "**Welcome Seller!**\n\nWhat do you want to sell?",
        components: [row]
      });

      return;
    }

    // =========================
    // SELL TYPE SELECTION (DM)
    // =========================
    if (interaction.customId.startsWith("sell_")) {

      const draft = await Draft.findOne({ userId: interaction.user.id });
      if (!draft) {
        return interaction.reply({
          content: "❌ Seller session expired. Click Seller again.",
          flags: 64
        });
      }

      draft.step = 1;
      draft.data = {};

      if (interaction.customId === "sell_account") {
        draft.sellType = "account";
        await draft.save();
        await interaction.user.send("Account Season Tag:");
      }

      if (interaction.customId === "sell_resources") {
        draft.sellType = "resources";
        await draft.save();
        await interaction.user.send("🌾 Enter **Food** amount:");
      }

      if (interaction.customId === "sell_kingdom") {
        draft.sellType = "kingdom";
        await draft.save();
        await interaction.user.send("Season (e.g. Season of Conquest):");
      }

      return interaction.reply({
        content: "✅ Selection saved. Continue in DMs.",
        flags: 64
      });
    }

    // =========================
    // BUYER BUTTON (SERVER)
    // =========================
    if (interaction.customId === "buyer") {

      await Draft.findOneAndUpdate(
        { userId: interaction.user.id },
        {
          userId: interaction.user.id,
          guildId: interaction.guild.id,
          role: "buyer",
          step: 0,
          data: {}
        },
        { upsert: true }
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("buytype_account")
          .setLabel("🧑‍💼 Account")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("buytype_resources")
          .setLabel("🌾 Resources")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("buytype_kingdom")
          .setLabel("🏰 Kingdom")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({
        content: "📩 Check your DMs to continue buyer setup.",
        flags: 64
      });

      await interaction.user.send({
        content: "**Welcome Buyer!**\n\nWhat do you want to buy?",
        components: [row]
      });

      return;
    }

    // =========================
    // BUY TYPE SELECTION (DM)
    // =========================
    if (interaction.customId.startsWith("buytype_")) {

      const draft = await Draft.findOne({ userId: interaction.user.id });
      if (!draft) {
        return interaction.reply({
          content: "❌ Buyer session expired. Click Buyer again.",
          flags: 64
        });
      }

      draft.buyType = interaction.customId.replace("buytype_", "");
      draft.step = 1;
      await draft.save();

      await interaction.reply({
        content: "✅ Selection saved. Continue in DMs.",
        flags: 64
      });

      return interaction.user.send("Enter your budget in USD (numbers only):");
    }

    // ==========================
    // BUY LISTING BUTTON (SERVER)
    // ==========================
    if (interaction.customId.startsWith("buy_")) {

      await interaction.deferReply({ flags: 64 });

      try {
        const listingId = parseInt(interaction.customId.split("_")[1]);

        const Listing = require("../models/Listing");
        const Guild = require("../models/Guild");
        const Deal = require("../models/Deal");
        const mmList = require("../config/mmList");

        const listing = await Listing.findOne({ listingId });
        if (!listing || listing.status !== "available") {
          return interaction.editReply({
            content: "❌ This listing is no longer available."
          });
        }

        const guildConfig = await Guild.findOne({ guildId: listing.guildId });
        const guildObj = await client.guilds.fetch(listing.guildId);

        const mmData = mmList[listing.mmName];
        if (!mmData) {
          return interaction.editReply({
            content: "❌ MM configuration error."
          });
        }

        listing.status = "in_deal";
        await listing.save();

        const ticket = await guildObj.channels.create({
          name: `deal-${listingId}`,
          type: ChannelType.GuildText,
          parent: guildConfig.ticketCategoryId,
          permissionOverwrites: [
            {
              id: guildObj.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
              id: listing.sellerId,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            },
            {
              id: mmData.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
            }
          ]
        });

        await ticket.send(
          `🛡 **Deal Started for Listing #${listingId}**\n\n` +
          `Buyer: <@${interaction.user.id}>\n` +
          `Seller: <@${listing.sellerId}>\n` +
          `MM: <@${mmData.id}>`
        );

        const deal = await Deal.create({
          listingId,
          guildId: listing.guildId,
          channelId: ticket.id,
          buyerId: interaction.user.id,
          sellerId: listing.sellerId,
          mmId: mmData.id,
          status: "waiting_payment"
        });

        const checklistMessage = await ticket.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("📋 Deal Checklist")
              .setColor(0x2ecc71)
              .setDescription(
`⬜ Payment Received  
⬜ Account Verified  
⬜ Account Secured  
⬜ Buyer Login Confirmed  
⬜ 24h Hold Started  
⬜ Payment Released`
              )
          ]
        });

        deal.checklistMessageId = checklistMessage.id;
        await deal.save();

        const channel = await client.channels.fetch(listing.channelId);
        const msg = await channel.messages.fetch(listing.messageId);

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`buy_${listingId}`)
            .setLabel("🔒 In Deal")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await msg.edit({ components: [disabledRow] });

        await interaction.editReply({
          content: `✅ Deal ticket created: ${ticket}`
        });

      } catch (err) {
        console.error("BUY BUTTON ERROR:", err);
        await interaction.editReply({
          content: "⚠ Something went wrong while starting the deal."
        });
      }
    }
  }
};
