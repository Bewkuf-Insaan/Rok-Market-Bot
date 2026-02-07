const { SlashCommandBuilder } = require("discord.js");
const Subscription = require("../../models/Subscription");
const { isOwner } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("extendsub")
    .setDescription("Extend an existing subscription")
    .addStringOption(option =>
      option
        .setName("guildid")
        .setDescription("The Guild ID to extend subscription for")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("days")
        .setDescription("Number of days to extend the subscription")
        .setRequired(true)
    ),

  async execute(interaction) {

    if (!isOwner(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Not authorized.",
        ephemeral: true
      });
    }

    const guildId = interaction.options.getString("guildid");
    const days = interaction.options.getInteger("days");

    const sub = await Subscription.findOne({ guildId });

    if (!sub) {
      return interaction.reply({
        content: "❌ Subscription not found.",
        ephemeral: true
      });
    }

    sub.expiresAt.setDate(sub.expiresAt.getDate() + days);
    sub.reminderSent = false;

    await sub.save();

    await interaction.reply({
      content: `✅ Subscription extended by ${days} days.`,
      ephemeral: true
    });
  }
};
