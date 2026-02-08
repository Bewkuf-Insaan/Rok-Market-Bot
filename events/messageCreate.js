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
    // =========================
    // DM ONLY
    // =========================
    if (message.guild) return;
    if (message.author.bot) return;

    const draft = await Draft.findOne({ userId: message.author.id });
    if (!draft) return;

    const data = draft.data || {};

    // =================================================
    // SELLER – ACCOUNT FLOW
    // =================================================
    if (draft.role === "seller" && draft.sellType === "account") {
      switch (draft.step) {

        case 1: data.seasonTag = message.content; break;
        case 2: data.detailsTag = message.content; break;
        case 3: data.kingdom = message.content; break;
        case 4: data.accountAge = message.content; break;
        case 5: data.power = message.content; break;
        case 6: data.kills = message.content; break;
        case 7: data.vip = message.content; break;
        case 8: data.castle = message.content; break;
        case 9: data.passport = message.content; break;
        case 10: data.commanders = message.content; break;
        case 11: data.equipment = message.content; break;
        case 12: data.citySkin = message.content; break;
        case 13: data.goldhead = message.content; break;
        case 14: data.bind = message.content; break;
        case 15: data.receipts = message.content; break;
        case 16: data.vipAccess = message.content; break;

        case 17: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("❌ Enter a valid price.");
          data.price = price;
          await updateDraft(message.author.id, 18, data);
          return message.author.send("Upload screenshots:");
        }

        case 18:
          if (!message.attachments.size)
            return message.author.send("❌ Upload screenshots.");
          data.screenshots = message.attachments.map(a => a.url);
          await updateDraft(message.author.id, 19, data);
          return message.author.send("Choose MM: Arsyu / Brahim / Aries");

        case 19:
          return finalizeListing(message, client, draft, data);
      }

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextAccountQuestion(draft.step + 1));
    }

    // =================================================
    // SELLER – RESOURCES FLOW
    // =================================================
    if (draft.role === "seller" && draft.sellType === "resources") {
      switch (draft.step) {

        case 1: data.food = message.content; break;
        case 2: data.wood = message.content; break;
        case 3: data.stone = message.content; break;
        case 4: data.gold = message.content; break;
        case 5: data.kingdom = message.content; break;
        case 6: data.migratable = message.content; break;

        case 7:
          if (!message.attachments.size)
            return message.author.send("❌ Upload screenshots.");
          data.screenshots = message.attachments.map(a => a.url);
          await updateDraft(message.author.id, 8, data);
          return message.author.send("Price (USD):");

        case 8: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("❌ Invalid price.");
          data.price = price;
          await updateDraft(message.author.id, 9, data);
          return message.author.send("Choose MM: Arsyu / Brahim / Aries");
        }

        case 9:
          return finalizeListing(message, client, draft, data);
      }

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextResourceQuestion(draft.step + 1));
    }

    // =================================================
    // SELLER – KINGDOM FLOW
    // =================================================
    if (draft.role === "seller" && draft.sellType === "kingdom") {
      switch (draft.step) {

        case 1: data.season = message.content; break;
        case 2: data.kingdom = message.content; break;
        case 3: data.mainAlliance = message.content; break;
        case 4: data.farmAlliance = message.content; break;
        case 5: data.provideAlliance = message.content; break;
        case 6: data.migration = message.content; break;
        case 7: data.rebels = message.content; break;

        case 8: {
          const price = parseInt(message.content);
          if (isNaN(price) || price <= 0)
            return message.author.send("❌ Invalid price.");
          data.price = price;
          await updateDraft(message.author.id, 9, data);
          return message.author.send("Choose MM: Arsyu / Brahim / Aries");
        }

        case 9:
          return finalizeListing(message, client, draft, data);
      }

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextKingdomQuestion(draft.step + 1));
    }

    // =================================================
    // BUYER FLOW (FINAL & FIXED)
    // =================================================
    if (draft.role === "buyer" && draft.step === 1) {

      const budget = parseInt(message.content);
      if (isNaN(budget) || budget <= 0)
        return message.author.send("❌ Enter a valid numeric budget.");

      draft.data.budget = budget;
      draft.step = 2;
      await draft.save();

      const guildConfig = await Guild.findOne({ guildId: draft.guildId });

      const listings = await Listing.find({
        guildId: draft.guildId,
        price: { $lte: budget },
        status: "available",
        sellType: draft.buyType
      }).limit(5);

      let reply = `💰 **${draft.buyType.toUpperCase()} listings:**\n\n`;

      if (!listings.length) {
        reply += "❌ No listings found.\n\n";
      } else {
        for (const l of listings) {
          reply += `🔹 **#${l.listingId}** — $${l.price}\n` +
            `https://discord.com/channels/${draft.guildId}/${l.channelId}/${l.messageId}\n\n`;
        }
      }

      if (draft.buyType === "resources")
        reply += `🌾 Browse more: https://discord.com/channels/${draft.guildId}/${guildConfig.resourceSellChannelId}\n\n`;

      if (draft.buyType === "kingdom")
        reply += `🏰 Browse more: https://discord.com/channels/${draft.guildId}/${guildConfig.kingdomSellChannelId}\n\n`;

      reply += "Click 🛒 **Buy Now** on a listing to start a deal.";

      return message.author.send(reply);
    }
  }
};

// =================================================
// FINALIZE LISTING
// =================================================
async function finalizeListing(message, client, draft, data) {
  const mmName = message.content.trim();
  if (!mmList[mmName])
    return message.author.send("❌ Invalid MM name.");

  data.mm = mmName;
  data.mmFee = Math.round(data.price * 0.10 * 100) / 100;

  const listingId = await getNextListingId();
  const guildConfig = await Guild.findOne({ guildId: draft.guildId });

  let channelId;
  if (draft.sellType === "account")
    channelId = guildConfig.priceChannels[getPriceRange(data.price)];
  if (draft.sellType === "resources")
    channelId = guildConfig.resourceSellChannelId;
  if (draft.sellType === "kingdom")
    channelId = guildConfig.kingdomSellChannelId;

  if (!channelId)
    return message.author.send("❌ Sell channel not configured.");

  const channel = await client.channels.fetch(channelId);
  const embed = buildListingEmbed(listingId, data, draft.sellType);

  const sent = await channel.send({
    embeds: [embed],
    files: data.screenshots || [],
    components: [{
      type: 1,
      components: [{
        type: 2,
        label: "🛒 Buy Now",
        style: 3,
        custom_id: `buy_${listingId}`
      }]
    }]
  });

  await createListing({
    listingId,
    guildId: draft.guildId,
    sellerId: message.author.id,
    sellType: draft.sellType,
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
