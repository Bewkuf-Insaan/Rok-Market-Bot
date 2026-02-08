const Listing = require("../models/Listing");
const { EmbedBuilder } = require("discord.js");
const getPriceRange = require("../config/priceRanges");

const MM_PERCENT = 0.10; // 10%

// =================================================
// CREATE LISTING
// =================================================
async function createListing(data) {
  try {
    const price = Number(data.price);
    const mmFee = Math.round(price * MM_PERCENT * 100) / 100;

    return await Listing.create({
      ...data,
      price,
      mmFee
    });
  } catch (error) {
    console.error("Error creating listing:", error);
    throw error;
  }
}

// =================================================
// UPDATE LISTING STATUS
// =================================================
async function updateListingStatus(listingId, status) {
  try {
    return await Listing.findOneAndUpdate(
      { listingId },
      { status },
      { new: true }
    );
  } catch (error) {
    console.error("Error updating listing status:", error);
    throw error;
  }
}

// =================================================
// GET AVAILABLE LISTINGS BY BUDGET
// =================================================
async function getAvailableListingsByBudget(guildId, budget) {
  try {
    return await Listing.find({
      guildId,
      price: { $lte: budget },
      status: "available"
    }).limit(5);
  } catch (error) {
    console.error("Error fetching listings:", error);
    throw error;
  }
}

// =================================================
// GET LISTING BY ID
// =================================================
async function getListingById(listingId) {
  try {
    return await Listing.findOne({ listingId });
  } catch (error) {
    console.error("Error fetching listing:", error);
    throw error;
  }
}

// =================================================
// MARK LISTING AS SOLD (AUTO ROUTING)
// =================================================
async function markListingAsSold(client, listing, guildConfig) {
  try {
    // Fetch original listing message
    const originalChannel = await client.channels.fetch(listing.channelId);
    const originalMessage = await originalChannel.messages.fetch(listing.messageId);

    if (!originalMessage) {
      console.log("Original listing message not found.");
      return;
    }

    // =============================
    // CLONE / BUILD SOLD EMBED
    // =============================
    let soldEmbed;

    if (originalMessage.embeds.length) {
      const oldEmbed = originalMessage.embeds[0];
      soldEmbed = EmbedBuilder.from(oldEmbed)
        .setColor(0xe74c3c)
        .setFooter({ text: "SOLD" });

      const statusIndex = oldEmbed.fields?.findIndex(f => f.name === "Status");
      if (statusIndex !== -1) {
        soldEmbed.spliceFields(statusIndex, 1, {
          name: "Status",
          value: "🔴 SOLD",
          inline: false
        });
      }
    } else {
      soldEmbed = new EmbedBuilder()
        .setTitle(`Listing #${listing.listingId}`)
        .setColor(0xe74c3c)
        .setDescription("🔴 SOLD");
    }

    // =============================
    // DETERMINE SOLD CHANNEL
    // =============================
    let soldChannelId = null;

    // 🧑‍💼 ACCOUNT
    if (listing.data?.seasonTag && listing.price) {
      const rangeKey = getPriceRange(listing.price);
      soldChannelId = guildConfig.soldChannels?.[rangeKey];
    }

    // 🌾 RESOURCES
    else if (
      listing.data?.food &&
      listing.data?.wood &&
      listing.data?.stone &&
      listing.data?.gold
    ) {
      soldChannelId = guildConfig.resourceSoldChannelId;
    }

    // 🏰 KINGDOM
    else if (
      listing.data?.season &&
      listing.data?.mainAlliance
    ) {
      soldChannelId = guildConfig.kingdomSoldChannelId;
    }

    if (!soldChannelId) {
      console.error("❌ SOLD channel not found for listing", listing.listingId);
      return;
    }

    const soldChannel = await client.channels.fetch(soldChannelId);

    // =============================
    // SEND TO SOLD CHANNEL
    // =============================
    await soldChannel.send({
      embeds: [soldEmbed],
      files: listing.screenshots || []
    });

    // =============================
    // DELETE ORIGINAL LISTING
    // =============================
    await originalMessage.delete().catch(() => {});

    return true;

  } catch (error) {
    console.error("Error marking listing as sold:", error);
    throw error;
  }
}

module.exports = {
  createListing,
  updateListingStatus,
  getAvailableListingsByBudget,
  getListingById,
  markListingAsSold
};
