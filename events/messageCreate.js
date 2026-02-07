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
          data.kingdom = message.content.trim();
          await updateDraft(message.author.id, 2, data);
          return message.author.send("Power:");

        case 2:
          data.power = message.content.trim();
          await updateDraft(message.author.id, 3, data);
          return message.author.send("Kill Points / Death:");

        case 3:
          data.kills = message.content.trim();
          await updateDraft(message.author.id, 4, data);
          return message.author.send("VIP:");

        case 4:
          data.vip = message.content.trim();
          await updateDraft(message.author.id, 5, data);
          return message.author.send("Castle Level:");

        case 5:
          data.castle = message.content.trim();
          await updateDraft(message.author.id, 6, data);
          return message.author.send("Price (USD - numbers only):");

        case 6:
          const price = parseInt(message.content);

          if (isNaN(price) || price <= 0)
            return message.author.send("Please enter a valid numeric price.");

          data.price = price;
          await updateDraft(message.author.id, 7, data);
          return message.author.send("Upload account screenshots now (send all in one message).");

        case 7:
          if (!message.attachments.size)
            return message.author.send("Please upload screenshots as image files.");

          data.screenshots = message.attachments.map(a => a.url);
          await updateDraft(message.author.id, 8, data);

          return message.author.send("Choose MM: Arsyu / Brahim / Aries");

        case 8:
          const mmName = message.content.trim();

          if (!mmList[mmName])
            return message.author.send("Invalid MM name. Type exactly: Arsyu, Brahim or Aries");

          data.mm = mmName;
          data.mmFee = mmList[mmName].fee;

          const listingId = await getNextListingId();

          const guildConfig = await Guild.findOne({ guildId: draft.guildId });

          if (!guildConfig)
            return message.author.send("Server configuration not found. Contact admin.");

          const range = getPriceRange(data.price);
          const channelId = guildConfig.priceChannels[range];

          if (!channelId)
            return message.author.send("Price channel not configured properly.");

          const channel = await client.channels.fetch(channelId);

          const embed = buildListingEmbed(listingId, data);

          const sent = await channel.send({
            embeds: [embed],
            files: data.screenshots
          });

          await createListing({
            listingId,
            guildId: draft.guildId,
            sellerId: message.author.id,
            mmName: data.mm,
            mmFee: data.mmFee,
            price: data.price,
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

    if (draft.role === "buyer") {

      if (draft.step === 1) {

        const budget = parseInt(message.content);

        if (isNaN(budget) || budget <= 0)
          return message.author.send("Please enter a valid numeric budget.");

        draft.data.budget = budget;
        draft.step = 2;
        await draft.save();

        const listings = await Listing.find({
          guildId: draft.guildId,
          price: { $lte: budget },
          status: "available"
        }).limit(5);

        if (!listings.length)
          return message.author.send("No listings found within your budget.");

        let reply = "Here are available listings:\n\n";

        listings.forEach(l => {
          reply += `#${l.listingId} - $${l.price}\n`;
        });

        reply += "\nTo start a deal, go to the server and run:\n`/interested listingid`";

        return message.author.send(reply);
      }

    }

  }
};
