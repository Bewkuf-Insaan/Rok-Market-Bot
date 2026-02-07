const Listing = require("../models/Listing");

async function monitorExpiredListings(client) {

  const listings = await Listing.find({
    status: "available"
  });

  const now = new Date();

  for (const listing of listings) {

    if (listing.expiresAt <= now) {

      listing.status = "expired";
      await listing.save();

      const channel = await client.channels.fetch(listing.channelId);
      const message = await channel.messages.fetch(listing.messageId);

      await message.edit({
        content: "⛔ This listing has expired (30 days)."
      });

    }
  }
}

module.exports = {
  monitorExpiredListings
};
