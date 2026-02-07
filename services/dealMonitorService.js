const Deal = require("../models/Deal");
const Listing = require("../models/Listing");

async function monitorInactiveDeals(client) {

  const deals = await Deal.find({
    status: { $in: ["waiting_payment", "account_check"] }
  });

  const now = new Date();

  for (const deal of deals) {

    const hoursPassed = (now - deal.createdAt) / (1000 * 60 * 60);

    if (hoursPassed >= 48) {

      deal.status = "cancelled";
      await deal.save();

      await Listing.findOneAndUpdate(
        { listingId: deal.listingId },
        { status: "available" }
      );

      const channel = await client.channels.fetch(deal.channelId);
      if (channel) {
        await channel.send("⏰ Deal auto-cancelled due to inactivity (48h).");
        await channel.permissionOverwrites.edit(channel.guild.id, {
          ViewChannel: false
        });
      }

    }
  }
}

module.exports = {
  monitorInactiveDeals
};
