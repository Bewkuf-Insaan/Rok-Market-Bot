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
    if (message.guild) return;
    if (message.author.bot) return;

    const draft = await Draft.findOne({ userId: message.author.id });
    if (!draft) return;

    const data = draft.data || {};

    /* =========================
       BUYER FLOW (FIXED)
    ========================= */
    if (draft.role === "buyer" && draft.step === 1) {

      if (!draft.buyType)
        return message.author.send("❌ Choose what you want to buy first.");

      const budget = parseInt(message.content);
      if (isNaN(budget) || budget <= 0)
        return message.author.send("❌ Enter a valid budget.");

      draft.step = 2;
      draft.data.budget = budget;
      await draft.save();

      const guildConfig = await Guild.findOne({ guildId: draft.guildId });

      const listings = await Listing.find({
        guildId: draft.guildId,
        sellType: draft.buyType,
        price: { $lte: budget },
        status: "available"
      }).limit(5);

      let reply = `💰 **${draft.buyType.toUpperCase()} listings:**\n\n`;

     if (!listings.length) {
  reply += `❌ No listings found under $${budget}.\n\n`;

  // 🔥 ACCOUNT → price range channel
  if (draft.buyType === "account") {
    const range = getPriceRange(budget);
    const channelId = guildConfig.priceChannels?.[range];

    if (channelId) {
      reply +=
        `🔎 You can check accounts in the **$${range}** range here:\n` +
        `https://discord.com/channels/${draft.guildId}/${channelId}\n\n`;
    }
  }

  // 🌾 RESOURCES
  if (draft.buyType === "resources" && guildConfig.resourceSellChannelId) {
    reply +=
      `🌾 Browse all resource listings here:\n` +
      `https://discord.com/channels/${draft.guildId}/${guildConfig.resourceSellChannelId}\n\n`;
  }

  // 🏰 KINGDOM
  if (draft.buyType === "kingdom" && guildConfig.kingdomSellChannelId) {
    reply +=
      `🏰 Browse all kingdom listings here:\n` +
      `https://discord.com/channels/${draft.guildId}/${guildConfig.kingdomSellChannelId}\n\n`;
  }
}

      reply += "Click 🛒 **Buy Now** to start a deal.";
      return message.author.send(reply);
    }
  }
};

