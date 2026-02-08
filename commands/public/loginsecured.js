const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("loginsecured")
    .setDescription("Confirm login security for the deal")
    .addIntegerOption(option =>
      option
        .setName("listingid")
        .setDescription("Listing ID of the deal")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const listingId = interaction.options.getInteger("listingid");

    const deal = await Deal.findOne({
      listingId,
      guildId: interaction.guild.id
    });

    if (!deal) {
      return interaction.editReply("❌ Deal not found.");
    }

    // MM or Seller only
    if (
      interaction.user.id !== deal.mmId &&
      interaction.user.id !== deal.sellerId
    ) {
      return interaction.editReply("❌ Only **MM or Seller** can use this command.");
    }

    if (deal.status !== "secured") {
      return interaction.editReply(
        `⚠️ Login can only be secured after account is secured.\nCurrent status: **${deal.status}**`
      );
    }

    deal.status = "login_confirmed";
    await deal.save();

    return interaction.editReply("✅ **Login has been successfully secured.**");
  }
};
