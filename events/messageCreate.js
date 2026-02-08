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

    // Only handle DMs
    if (message.guild) return;
    if (message.author.bot) return;

    const draft = await Draft.findOne({ userId: message.author.id });
    if (!draft) return;

    const data = draft.data;

    // =================================================
    // SELLER FLOW
    // =================================================

    if (draft.role === "seller") {

      switch (draft.step) {

  case 1:
    data.seasonTag = message.content.trim();
    await updateDraft(message.author.id, 2, data);
    return message.author.send("Account Details Tag (e.g., Openfield/Mixed):");

  case 2:
    data.detailsTag = message.content.trim();
    await updateDraft(message.author.id, 3, data);
    return message.author.send("Kingdom:");

  case 3:
    data.kingdom = message.content.trim();
    await updateDraft(message.author.id, 4, data);
    return message.author.send("Account Age (in days):");

  case 4:
    data.accountAge = message.content.trim();
    await updateDraft(message.author.id, 5, data);
    return message.author.send("Power:");

  case 5:
    data.power = message.content.trim();
    await updateDraft(message.author.id, 6, data);
    return message.author.send("Kill Points / Death:");

  case 6:
    data.kills = message.content.trim();
    await updateDraft(message.author.id, 7, data);
    return message.author.send("VIP:");

  case 7:
    data.vip = message.content.trim();
    await updateDraft(message.author.id, 8, data);
    return message.author.send("Castle Level:");

  case 8:
    data.castle = message.content.trim();
    await updateDraft(message.author.id, 9, data);
    return message.author.send("Passport / Alliance Coin:");

  case 9:
    data.passport = message.content.trim();
    await updateDraft(message.author.id, 10, data);
    return message.author.send("Legendary Commanders expertised:");

  case 10:
    data.commanders = message.content.trim();
    await updateDraft(message.author.id, 11, data);
    return message.author.send("Legendary Equipment:");

  case 11:
    data.equipment = message.content.trim();
    await updateDraft(message.author.id, 12, data);
    return message.author.send("Legendary City Skin:");

  case 12:
    data.citySkin = message.content.trim();
    await updateDraft(message.author.id, 13, data);
    return message.author.send("Goldhead:");

  case 13:
    data.goldhead = message.content.trim();
    await updateDraft(message.author.id, 14, data);
    return message.author.send("Account Linked / Bind:");

  case 14:
    data.bind = message.content.trim();
    await updateDraft(message.author.id, 15, data);
    return message.author.send("First Purchase Receipts (Available / Not Available / F2P):");

  case 15:
    data.receipts = message.content.trim();
    await updateDraft(message.author.id, 16, data);
    return message.author.send("Have VIP Access (Yes / No):");

  case 16:
    data.vipAccess = message.content.trim();
    await updateDraft(message.author.id, 17, data);
    return message.author.send("Price (USD - numbers only):");

  case 17:
    const price = parseInt(message.content);
    if (isNaN(price) || price <= 0)
      return message.author.send("Please enter a valid numeric price.");

    data.price = price;
    await updateDraft(message.author.id, 18, data);
    return message.author.send("Upload account screenshots now (send all in one message).");

  case 18:
    if (!message.attachments.size)
      return message.author.send("Please re-upload screenshots.");

    data.screenshots = message.attachments.map(a => a.url);
    await updateDraft(message.author.id, 19, data);

    return message.author.send("Choose MM: Arsyu / Brahim / Aries");

  case 19: {
  const mmName = message.content.trim();

  if (!mmList[mmName])
    return message.author.send("Invalid MM name. Type exactly: Arsyu, Brahim or Aries");

  data.mm = mmName;

  // ✅ MM fee = 10% of price
  const MM_PERCENT = 0.10;
  data.mmFee = Math.round(data.price * MM_PERCENT * 100) / 100;

  const listingId = await getNextListingId();
  const guildConfig = await Guild.findOne({ guildId: draft.guildId });

  if (!guildConfig)
    return message.author.send("Server configuration not found.");

  const range = getPriceRange(data.price);
  const channelId = guildConfig.priceChannels[range];
  const channel = await client.channels.fetch(channelId);

  const embed = buildListingEmbed(listingId, data);

  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

  const buyButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`buy_${listingId}`)
      .setLabel("🛒 Buy Now")
      .setStyle(ButtonStyle.Success)
  );

  const sent = await channel.send({
    embeds: [embed],
    files: data.screenshots,
    components: [buyButton]
  });

  await createListing({
    listingId,
    guildId: draft.guildId,
    sellerId: message.author.id,
    mmName: data.mm,
    price: data.price,
    mmFee: data.mmFee, // ✅ correct value stored
    status: "available",
    data,
    screenshots: data.screenshots,
    messageId: sent.id,
    channelId: channel.id
  });

  await deleteDraft(message.author.id);
  return message.author.send("✅ Listing posted successfully!");
}

    }

    // =================================================
    // BUYER FLOW
    // =================================================

   // =================================================
// BUYER FLOW
// =================================================

if (draft.role === "buyer") {

  if (draft.step === 1) {

    const budget = parseInt(message.content);

    if (isNaN(budget) || budget <= 0)
      return message.author.send("Please enter a valid numeric budget.");

    draft.data.budget = budget;
    draft.step = 2;
    await draft.save();

    const guildConfig = await Guild.findOne({ guildId: draft.guildId });

    if (!guildConfig)
      return message.author.send("Server configuration not found.");

    const listings = await Listing.find({
      guildId: draft.guildId,
      price: { $lte: budget },
      status: "available"
    }).limit(5);

    let reply = "💰 Based on your budget:\n\n";

    // 🔹 Send listing links if found
    if (listings.length) {

      for (const l of listings) {

        const messageLink =
          `https://discord.com/channels/${draft.guildId}/${l.channelId}/${l.messageId}`;

        reply += `🔹 **#${l.listingId}** - $${l.price}\n`;
        reply += `🔗 ${messageLink}\n\n`;
      }

    } else {
      reply += "❌ No exact listings found within your budget.\n\n";
    }

    // 🔹 Always send price range channel link
    const range = getPriceRange(budget);
    const channelId = guildConfig.priceChannels?.[range];

    if (channelId) {
      const channelLink =
        `https://discord.com/channels/${draft.guildId}/${channelId}`;

      reply += "📂 You can also browse this channel:\n";
      reply += `${channelLink}\n\n`;
    } else {
      reply += "⚠ Price channel not configured for this range.\n\n";
    }

    reply += "To start a deal, go to the server and click 🛒 Buy Now button.";

    return message.author.send(reply);
  }
}


  }
};


