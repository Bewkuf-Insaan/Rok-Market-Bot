const { handleSubscriptionReminders } = require("../services/subscriptionService");
const { monitorInactiveDeals } = require("../services/dealMonitorService");
const { monitorExpiredListings } = require("../services/listingMonitorService");
const MMProfile = require("../models/MMProfile");
const mmDetails = require("../config/mmDetails");


module.exports = {
  name: "ready",
  once: true,

  async execute(client) {

    console.log(`🚀 Logged in as ${client.user.tag}`);
    // Ensure MM profiles exist
for (const mm of mmDetails) {
  await MMProfile.findOneAndUpdate(
    { userId: mm.userId },
    {
      name: mm.name,
      country: mm.country,
      whatsapp: mm.whatsapp
    },
    { upsert: true }
  );
}


    // ==========================================
    // Inactive Deal Monitor (48h Auto Cancel)
    // ==========================================
    setInterval(() => {
      monitorInactiveDeals(client);
    }, 1000 * 60 * 30); // every 30 minutes

    // ==========================================
    // Listing Expiry Monitor (30 Days)
    // ==========================================
    setInterval(() => {
      monitorExpiredListings(client);
    }, 1000 * 60 * 30); // every 30 minutes

    // ==========================================
    // Subscription Reminder Monitor
    // ==========================================
    setInterval(() => {
      handleSubscriptionReminders(client);
    }, 1000 * 60 * 60); // every 1 hour

    console.log("✅ Background monitors started successfully.");

  }
};
