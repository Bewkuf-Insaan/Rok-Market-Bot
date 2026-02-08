const Draft = require("../models/Draft");
const Listing = require("../models/Listing");
const Guild = require("../models/Guild");

const { updateDraft, deleteDraft } = require("../services/sellerFlow");
const { createListing } = require("../services/listingService");

const getNextListingId = require("../utils/generateId");
const buildListingEmbed = require("../utils/embedBuilder");
const getPriceRange = require("../config/priceRanges");
const mmList = require("../config/mmList");

module.exports = {
  name: "messageCreate",

  async execute(message, client) {
    // DM only
    if (message.guild) return;
    if (message.author.bot) return;

    const draft = await Draft.findOne({ userId: message.author.id });
    if (!draft) return;

    const data = draft.data;

    // =================================================
    // SELLER – ACCOUNT FLOW (UNCHANGED)
    // =================================================
    if (draft.role === "seller" && draft.sellType === "account") {
      switch (draft.step) {
        case 1:
          data.seasonTag = message.content.trim();
          return updateDraft(message.author.id, 2, data)
            .then(() => message.author.send("Account Details Tag (e.g., Openfield/Mixed):"));

        case 2:
          data.detailsTag = message.content.trim();
          return updateDraft(message.author.id, 3, data)
            .then(() => message.author.send("Kingdom:"));

        case 3:
          data.kingdom = message.content.trim();
          return updateDraft(message.author.id, 4, data)
            .then(() => message.author.send("Account Age (in days):"));

        case 4:
          data.accountAge = message.content.trim();
          return updateDraft(message.author.id, 5, data)
            .then(() => message.author.send("Power:"));

        case 5:
          data.power = message.content.trim();
          return updateDraft(message.author.id, 6, data)
            .then(() => message.author.send("Kill Points / Death:"));

        case 6:
          data.kills = message.content.trim();
          return updateDraft(message.author.id, 7, data)
            .then(() => message.author.send("VIP:"));

        case 7:
          data.vip = message.content.trim();
          return updateDraft(message.author.id, 8, data)
            .then(() => message.author.send("Castle Level:"));

        case 8:
          data.castle = message.content.trim();
          return updateDraft(message.author.id, 9, data)
            .then(() => message.author.send("Passport / Alliance Coin:"));

        case 9:
          data.passport = message.content.trim();
          return updateDraft(message.author.id, 10, data)
            .then(() => message.author.send("Legendary Commanders expertised:"));

        case 10:
          data.commanders = message.content.trim();
          return updateDraft(message.author.id, 11, data)
            .then(() => message.author.send("Legendary Equipment:"));

        case 11:
          data.equipment = message.content.trim();
          return updateDraft(message.author.id, 12, data)
            .then(() => message.author.send("Legendary City Skin:"));

        case 12:
          data.citySkin = message.content.trim();
          return updateDraft(message.author.id, 13, data)
            .then(() => message.author.send("Goldhead:"));

        case 13:
          data.goldhead = message.content.trim();
          return updateDraft(message.author.id, 14, data)
            .then(() => message.author.send("Account Linked / Bind:"));

        case 14:
          data.bind = message.content.trim();
          return updateDraft(message.author.id, 15, data)
            .then(() => message.author.send("First Purchase Receipts (Available / Not Available / F2P):"));

        case 15:
          data.receipts = message.content.trim();
          return updateDraft(message.author.id, 16, data)
            .then(() => message.author.send("Have VIP Access (Yes / No):"));

        case 16:
          data.vipAccess = message.content.trim();
          return updateDraft(message.author.id, 17, data)
            .then(() => message.author.send("Price (USD - numbers only):"));

        case 17: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("Please enter a valid numeric price.");

          data.price = price;
          return updateDraft(message.author.id, 18, data)
            .then(() => message.author.send("Upload screenshots (one message):"));
        }

        case 18:
          if (!message.attachments.size)
            return message.author.send("Please upload screenshots.");

          data.screenshots = message.attachments.map(a => a.url);
          return updateDraft(message.author.id, 19, data)
            .then(() => message.author.send("Choose MM: Arsyu / Brahim / Aries"));

        case 19:
          return finalizeListing(message, client, draft, data);
      }
    }

    // =================================================
    // SELLER – RESOURCES FLOW (FIXED)
    // =================================================
    if (draft.role === "seller" && draft.sellType === "resources") {
      switch (draft.step) {
        case 1:
          data.food = message.content.trim();
          return updateDraft(message.author.id, 2, data)
            .then(() => message.author.send("🌲 Enter Wood amount:"));

        case 2:
          data.wood = message.content.trim();
          return updateDraft(message.author.id, 3, data)
            .then(() => message.author.send("🪨 Enter Stone amount:"));

        case 3:
          data.stone = message.content.trim();
          return updateDraft(message.author.id, 4, data)
            .then(() => message.author.send("🥇 Enter Gold amount:"));

        case 4:
          data.gold = message.content.trim();
          return updateDraft(message.author.id, 5, data)
            .then(() => message.author.send("Which Kingdom are resources in?"));

        case 5:
          data.kingdom = message.content.trim();
          return updateDraft(message.author.id, 6, data)
            .then(() => message.author.send("Can migrate? (Yes / No)"));

        case 6:
          data.migratable = message.content.trim();
          return updateDraft(message.author.id, 7, data)
            .then(() => message.author.send("Upload screenshots:"));

        case 7:
          if (!message.attachments.size)
            return message.author.send("Please upload screenshots.");

          data.screenshots = message.attachments.map(a => a.url);
          return updateDraft(message.author.id, 8, data)
            .then(() => message.author.send("Price (USD):"));

        case 8: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("Invalid price.");

          data.price = price;
          return updateDraft(message.author.id, 9, data)
            .then(() => message.author.send("Choose MM: Arsyu / Brahim / Aries"));
        }

        case 9:
          return finalizeListing(message, client, draft, data);
      }
    }

    // =================================================
    // SELLER – KINGDOM FLOW (FIXED)
    // =================================================
    if (draft.role === "seller" && draft.sellType === "kingdom") {
      switch (draft.step) {
        case 1:
          data.season = message.content.trim();
          return updateDraft(message.author.id, 2, data)
            .then(() => message.author.send("Kingdom Number:"));

        case 2:
          data.kingdom = message.content.trim();
          return updateDraft(message.author.id, 3, data)
            .then(() => message.author.send("Main Alliance in Zone 3 (tech):"));

        case 3:
          data.mainAlliance = message.content.trim();
          return updateDraft(message.author.id, 4, data)
            .then(() => message.author.send("Farm Alliance count:"));

        case 4:
          data.farmAlliance = message.content.trim();
          return updateDraft(message.author.id, 5, data)
            .then(() => message.author.send("Alliances you can provide:"));

        case 5:
          data.provideAlliance = message.content.trim();
          return updateDraft(message.author.id, 6, data)
            .then(() => message.author.send("Migration status:"));

        case 6:
          data.migration = message.content.trim();
          return updateDraft(message.author.id, 7, data)
            .then(() => message.author.send("Are there rebels? (Yes / No)"));

        case 7:
          data.rebels = message.content.trim();
          return updateDraft(message.author.id, 8, data)
            .then(() => message.author.send("Price (USD):"));

        case 8: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("Invalid price.");

          data.price = price;
          return updateDraft(message.author.id, 9, data)
            .then(() => message.author.send("Choose MM: Arsyu / Brahim / Aries"));
        }

        case 9:
          return finalizeListing(message, client, draft, data);
      }
    }
  }
};

// =================================================
// SHARED FINALIZE FUNCTION (ALL SELL TYPES)
// =================================================
async function finalizeListing(message, client, draft, data) {
  const mmName = message.content.trim();
  if (!mmList[mmName])
    return message.author.send("Invalid MM name.");

  data.mm = mmName;
  data.mmFee = Math.round(data.price * 0.10 * 100) / 100;

  const listingId = await getNextListingId();
  const guildConfig = await Guild.findOne({ guildId: draft.guildId });

  const range = getPriceRange(data.price);
  const channel = await client.channels.fetch(guildConfig.priceChannels[range]);

  const embed = buildListingEmbed(listingId, data);

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_${listingId}`)
      .setLabel("🛒 Buy Now")
      .setStyle(ButtonStyle.Success)
  );

  const sent = await channel.send({
    embeds: [embed],
    files: data.screenshots || [],
    components: [row]
  });

  await createListing({
    listingId,
    guildId: draft.guildId,
    sellerId: message.author.id,
    mmName: data.mm,
    price: data.price,
    mmFee: data.mmFee,
    status: "available",
    data,
    screenshots: data.screenshots || [],
    messageId: sent.id,
    channelId: channel.id
  });

  await deleteDraft(message.author.id);
  return message.author.send("✅ Listing posted successfully!");
}
