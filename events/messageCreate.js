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

    /* =================================================
       SELLER – ACCOUNT
    ================================================= */
    if (draft.role === "seller" && draft.sellType === "account") {

      if (draft.step === 17) {
        const price = parseInt(message.content);
        if (isNaN(price) || price <= 0)
          return message.author.send("❌ Enter a valid numeric price.");

        data.price = price;
        await updateDraft(message.author.id, 18, data);
        return message.author.send("📸 Upload screenshots:");
      }

      if (draft.step === 18) {
        if (!message.attachments.size)
          return message.author.send("❌ Please upload screenshots.");

        data.screenshots = message.attachments.map(a => a.url);
        await updateDraft(message.author.id, 19, data);
        return message.author.send("Choose MM: Arsyu / Brahim / Aries");
      }

      if (draft.step === 19) {
        return finalizeListing(message, client, draft, data);
      }

      const accountFields = [
        "seasonTag","detailsTag","kingdom","accountAge","power","kills",
        "vip","castle","passport","commanders","equipment","citySkin",
        "goldhead","bind","receipts","vipAccess"
      ];

      const field = accountFields[draft.step - 1];
      if (field) data[field] = message.content;

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextAccountQuestion(draft.step + 1));
    }

    /* =================================================
       SELLER – RESOURCES
    ================================================= */
    if (draft.role === "seller" && draft.sellType === "resources") {

      if (draft.step === 7) {
        if (!message.attachments.size)
          return message.author.send("❌ Upload screenshots.");

        data.screenshots = message.attachments.map(a => a.url);
        await updateDraft(message.author.id, 8, data);
        return message.author.send("💰 Price (USD):");
      }

      if (draft.step === 8) {
        const price = parseInt(message.content);
        if (isNaN(price) || price <= 0)
          return message.author.send("❌ Invalid price.");

        data.price = price;
        await updateDraft(message.author.id, 9, data);
        return message.author.send("Choose MM: Arsyu / Brahim / Aries");
      }

      if (draft.step === 9) {
        return finalizeListing(message, client, draft, data);
      }

      const resFields = ["food","wood","stone","gold","kingdom","migratable"];
      const field = resFields[draft.step - 1];
      if (field) data[field] = message.content;

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextResourceQuestion(draft.step + 1));
    }

    /* =================================================
       SELLER – KINGDOM
    ================================================= */
    if (draft.role === "seller" && draft.sellType === "kingdom") {

      if (draft.step === 8) {
        const price = parseInt(message.content);
        if (isNaN(price) || price <= 0)
          return message.author.send("❌ Invalid price.");

        data.price = price;
        await updateDraft(message.author.id, 9, data);
        return message.author.send("Choose MM: Arsyu / Brahim / Aries");
      }

      if (draft.step === 9) {
        return finalizeListing(message, client, draft, data);
      }

      const kdFields = [
        "season","kingdom","mainAlliance","farmAlliance",
        "provideAlliance","migration","rebels"
      ];

      const field = kdFields[draft.step - 1];
      if (field) data[field] = message.content;

      await updateDraft(message.author.id, draft.step + 1, data);
      return message.author.send(nextKingdomQuestion(draft.step + 1));
    }

    /* =================================================
       BUYER FLOW (100% FIXED)
    ================================================= */
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
        sellType: draft.buyType,
        price: { $lte: budget },
        status: "available"
      }).limit(5);

      let reply = `💰 **${draft.buyType.toUpperCase()} listings for your budget:**\n\n`;

      if (!listings.length) {
        reply += "❌ No listings found.\n\n";
      } else {
        for (const l of listings) {
          reply += `🔹 **#${l.listingId}** — $${l.price}\n` +
            `https://discord.com/channels/${draft.guildId}/${l.channelId}/${l.messageId}\n\n`;
        }
      }

      if (draft.buyType === "resources")
        reply += `🌾 More resources:\nhttps://discord.com/channels/${draft.guildId}/${guildConfig.resourceSellChannelId}\n\n`;

      if (draft.buyType === "kingdom")
        reply += `🏰 More kingdoms:\nhttps://discord.com/channels/${draft.guildId}/${guildConfig.kingdomSellChannelId}\n\n`;

      reply += "Click 🛒 **Buy Now** on any listing to start a deal.";

      return message.author.send(reply);
    }
  }
};

/* =================================================
   FINALIZE LISTING
================================================= */
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

/* =================================================
   QUESTION HELPERS
================================================= */
function nextAccountQuestion(step) {
  const q = {
    2:"Account Details Tag:",
    3:"Kingdom:",
    4:"Account Age:",
    5:"Power:",
    6:"Kill Points / Death:",
    7:"VIP:",
    8:"Castle Level:",
    9:"Passport / Alliance Coin:",
    10:"Legendary Commanders:",
    11:"Legendary Equipment:",
    12:"Legendary City Skin:",
    13:"Goldhead:",
    14:"Account Bind:",
    15:"Receipts:",
    16:"VIP Access:",
    17:"Price (USD):"
  };
  return q[step] || "Next:";
}

function nextResourceQuestion(step) {
  const q = {
    2:"🌲 Wood amount:",
    3:"🪨 Stone amount:",
    4:"🥇 Gold amount:",
    5:"Kingdom:",
    6:"Migratable? (Yes/No):",
    7:"Upload screenshots:"
  };
  return q[step] || "Next:";
}

function nextKingdomQuestion(step) {
  const q = {
    2:"Kingdom number:",
    3:"Main alliance:",
    4:"Farm alliance count:",
    5:"Alliances provided:",
    6:"Migration status:",
    7:"Rebels? (Yes/No):",
    8:"Price (USD):"
  };
  return q[step] || "Next:";
}
