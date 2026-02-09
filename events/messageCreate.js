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
    if (message.author.bot) return;

    const draft = await Draft.findOne({ userId: message.author.id });
    if (!draft) return;

    // ❗ Force DM replies
    if (message.guild) {
      await message.reply("📩 Please answer in **DM**, not in the server.");
      return;
    }

    const data = draft.data || {};

    /* =================================================
       BUYER FLOW
    ================================================= */
   if (draft.role === "buyer" && draft.step === 1) {

  if (!draft.buyType) {
    return message.author.send("❌ Choose what you want to buy first.");
  }

  const budget = parseInt(message.content);
  if (isNaN(budget) || budget <= 0) {
    return message.author.send("❌ Enter a valid numeric budget.");
  }

  draft.step = 2;
  draft.data.budget = budget;
  await draft.save();

  const guildConfig = await Guild.findOne({ guildId: draft.guildId });

  let listings = [];

  // 🌾 RESOURCES → under budget
  if (draft.buyType === "resources") {
    listings = await Listing.find({
      guildId: draft.guildId,
      sellType: "resources",
      status: "available",
      price: { $lte: budget }
    })
      .sort({ price: 1 })
      .limit(5);

  } else {
    // 🧑‍💼 ACCOUNT + 🏰 KINGDOM → ±100 logic
    const minPrice = Math.max(0, budget - 100);
    const maxPrice = budget + 100;

    listings = await Listing.find({
      guildId: draft.guildId,
      sellType: draft.buyType,
      status: "available",
      $expr: {
        $and: [
          {
            $gte: [
              { $convert: { input: "$price", to: "int", onError: 0, onNull: 0 } },
              minPrice
            ]
          },
          {
            $lte: [
              { $convert: { input: "$price", to: "int", onError: 999999999, onNull: 999999999 } },
              maxPrice
            ]
          }
        ]
      }
    }).limit(10);

    listings.sort(
      (a, b) =>
        Math.abs(Number(a.price) - budget) -
        Math.abs(Number(b.price) - budget)
    );

    listings = listings.slice(0, 5);
  }

  let reply = `💰 **${draft.buyType.toUpperCase()} listings near $${budget}:**\n\n`;

  if (!listings.length) {
    reply += `❌ No listings found.\n\n`;
  } else {
    for (const l of listings) {
      reply +=
        `🔹 **#${l.listingId}** — $${l.price}\n` +
        `https://discord.com/channels/${draft.guildId}/${l.channelId}/${l.messageId}\n\n`;
    }
  }

  // 🔎 Explore more listings
  if (draft.buyType === "account") {
    const range = getPriceRange(budget);
    const channelId = guildConfig.priceChannels?.[range];
    if (channelId) {
      reply +=
        `🔎 Explore more accounts in **$${range}** range:\n` +
        `https://discord.com/channels/${draft.guildId}/${channelId}\n\n`;
    }
  }

  if (draft.buyType === "resources" && guildConfig.resourceSellChannelId) {
    reply +=
      `🌾 Explore all resource listings:\n` +
      `https://discord.com/channels/${draft.guildId}/${guildConfig.resourceSellChannelId}\n\n`;
  }

  if (draft.buyType === "kingdom" && guildConfig.kingdomSellChannelId) {
    reply +=
      `🏰 Explore all kingdom listings:\n` +
      `https://discord.com/channels/${draft.guildId}/${guildConfig.kingdomSellChannelId}\n\n`;
  }

  reply += "Click 🛒 **Buy Now** on a listing to start a deal.";
  return message.author.send(reply);
}

    /* =================================================
       SELLER – ACCOUNT
    ================================================= */
    if (draft.role === "seller" && draft.sellType === "account") {

      const fields = [
        "seasonTag","detailsTag","kingdom","accountAge","power","kills",
        "vip","castle","passport","commanders","equipment","citySkin",
        "goldhead","bind","receipts","vipAccess"
      ];

      if (draft.step >= 1 && draft.step <= fields.length) {
        data[fields[draft.step - 1]] = message.content;
        await updateDraft(message.author.id, draft.step + 1, data);
        return message.author.send(nextAccountQuestion(draft.step + 1));
      }

      if (draft.step === 17) {
        const price = parseInt(message.content);
        if (isNaN(price) || price <= 0)
          return message.author.send("❌ Enter a valid price.");

        data.price = price;
        await updateDraft(message.author.id, 18, data);
        return message.author.send("📸 Upload screenshots of account:");
      }

      if (draft.step === 18) {
        if (!message.attachments.size)
          return message.author.send("❌ Upload screenshots.");

        data.screenshots = message.attachments.map(a => a.url);
        await updateDraft(message.author.id, 19, data);
        return message.author.send("Choose MM: Arsyu / Brahim / Aries");
      }

      if (draft.step === 19) {
        return finalizeListing(message, client, draft, data);
      }
    }

    /* =================================================
       SELLER – RESOURCES
    ================================================= */
    if (draft.role === "seller" && draft.sellType === "resources") {

      const fields = ["food","wood","stone","gold","kingdom","migratable"];

      if (draft.step >= 1 && draft.step <= fields.length) {
        data[fields[draft.step - 1]] = message.content;
        await updateDraft(message.author.id, draft.step + 1, data);
        return message.author.send(nextResourceQuestion(draft.step + 1));
      }

      if (draft.step === 7) {
        if (!message.attachments.size)
          return message.author.send("❌ Upload screenshotsof resources.");

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
    }

    /* =================================================
       SELLER – KINGDOM
    ================================================= */
   if (draft.role === "seller" && draft.sellType === "kingdom") {

  const fields = [
    "season","kingdom","mainAlliance","farmAlliance",
    "provideAlliance","migration","rebels"
  ];

  if (draft.step >= 1 && draft.step <= fields.length) {
    data[fields[draft.step - 1]] = message.content;
    await updateDraft(message.author.id, draft.step + 1, data);
    return message.author.send(nextKingdomQuestion(draft.step + 1));
  }

  // STEP 8 → PRICE
  if (draft.step === 8) {
    const price = parseInt(message.content);
    if (isNaN(price) || price <= 0)
      return message.author.send("❌ Invalid price.");

    data.price = price;
    await updateDraft(message.author.id, 9, data);
    return message.author.send("📸 Upload kingdom screenshots:");
  }

  // STEP 9 → SCREENSHOTS
  if (draft.step === 9) {
    if (!message.attachments.size)
      return message.author.send("❌ Please upload at least one screenshot.");

    data.screenshots = message.attachments.map(a => a.url);
    await updateDraft(message.author.id, 10, data);
    return message.author.send("Choose MM: Arsyu / Brahim / Aries");
  }

  // STEP 10 → FINALIZE
  if (draft.step === 10) {
    return finalizeListing(message, client, draft, data);
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
  price: Number(data.price), // 🔥 FORCE NUMBER
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
   QUESTIONS
================================================= */
function nextAccountQuestion(step) {
  const q = {
    2:"Account Type (Openfield/Rally/Garrison Leads):",
    3:"Kingdom Number:",
    4:"Account Age(days):",
    5:"Power:",
    6:"Kill Points / Death:",
    7:"VIP:",
    8:"Castle Level:",
    9:"Passport / Alliance Coin:",
    10:"Legendary Commanders Expertised:",
    11:"Legendary Equipment / Crits:",
    12:"Legendary City Skin:",
    13:"Goldhead:",
    14:"Account Bind (Facebook/Gmail):",
    15:"First/Last 6 Months Receipts Available?:",
    16:"VIP Access (Yes/No):",
    17:"Price (USD):"
  };
  return q[step];
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
  return q[step];
}

function nextKingdomQuestion(step) {
  const q = {
    2:"Kingdom number:",
    3:"Main alliance count:",
    4:"Farm alliance count:",
    5:"Alliances provided:",
    6:"Migration status (Whales):",
    7:"Rebels? (Yes/No):",
    8:"Price (USD):"
  };
  return q[step];
}











