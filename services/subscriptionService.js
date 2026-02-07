const Subscription = require("../models/Subscription");

async function checkSubscription(guildId) {
  const sub = await Subscription.findOne({ guildId });

  if (!sub) return false;
  if (new Date() > sub.expiresAt) return false;

  return true;
}

async function handleSubscriptionReminders(client) {
  const subs = await Subscription.find();

  for (const sub of subs) {
    const now = new Date();
    const diff = sub.expiresAt - now;
    const daysLeft = diff / (1000 * 60 * 60 * 24);

    if (daysLeft <= 3 && !sub.reminderSent) {
      const guild = client.guilds.cache.get(sub.guildId);
      if (!guild) continue;

      const owner = await guild.fetchOwner();
      await owner.send(
        `⚠ Your subscription for **${guild.name}** expires in 3 days.`
      );

      sub.reminderSent = true;
      await sub.save();
    }

    if (sub.expiresAt < now) {
      await Subscription.deleteOne({ guildId: sub.guildId });
    }
  }
}

module.exports = {
  checkSubscription,
  handleSubscriptionReminders
};
