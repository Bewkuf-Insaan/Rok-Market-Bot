const { SlashCommandBuilder } = require("discord.js");
const Subscription = require("../../models/Subscription");
const { isOwner } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addsub")
    .setDescription("Add subscription to a server")
    .addStringOption(option =>
      option
        .setName("guildid")
        .setDescription("The Guild ID to add subscription to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("days")
        .setDescription("Number of days for the subscription")
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

    const expires = new Date();
    expires.setDate(expires.getDate() + days);

    await Subscription.findOneAndUpdate(
      { guildId },
      {
        guildId,
        expiresAt: expires,
        reminderSent: false
      },
      { upsert: true }
    );

    await interaction.reply({
      content: `✅ Subscription added for ${days} days.`,
      ephemeral: true
    });
  }
};
