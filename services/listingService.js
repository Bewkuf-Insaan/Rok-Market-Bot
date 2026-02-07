const Listing = require("../models/Listing");
const { EmbedBuilder } = require("discord.js");
const getPriceRange = require("../config/priceRanges");


// =================================================
// CREATE LISTING
// =================================================

async function createListing(data) {
  try {
    return await Listing.create(data);
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
// MARK LISTING AS SOLD
// =================================================

async function markListingAsSold(client, listing, guildConfig) {

  try {

    // Fetch original channel + message
    const originalChannel = await client.channels.fetch(listing.channelId);
    const originalMessage = await originalChannel.messages.fetch(listing.messageId);

    if (!originalMessage) {
      console.log("Original listing message not found.");
      return;
    }

    // Clone old embed safely
    const oldEmbed = originalMessage.embeds[0];
    const newEmbed = EmbedBuilder.from(oldEmbed)
      .setColor(0xe74c3c)
      .spliceFields(
        oldEmbed.fields.findIndex(f => f.name === "Status"),
        1,
        { name: "Status", value: "🔴 SOLD", inline: false }
      );

    // Determine correct sold channel
    const rangeKey = getPriceRange(listing.price);
    const soldChannelId = guildConfig.soldChannels[rangeKey];

    if (!soldChannelId) {
      console.log("Sold channel not configured.");
      return;
    }

    const soldChannel = await client.channels.fetch(soldChannelId);

    // Send new message in sold channel
    await soldChannel.send({
      embeds: [newEmbed],
      files: listing.screenshots || []
    });

    // Delete original listing message
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
