const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../models/Deal");
const { isMMorSeller } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loginsecured")
    .setDescription("Mark login as secured for a deal")
    .addStringOption(option =>
      option
        .setName("dealid")
        .setDescription("Deal ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const dealId = interaction.options.getString("dealid");
    const deal = await Deal.findOne({ dealId });

    if (!deal) {
      return interaction.editReply("❌ Deal not found.");
    }

    if (!isMMorSeller(interaction.user.id, deal)) {
      return interaction.editReply("❌ Only **MM or Seller** can use this command.");
    }

    if (!deal.accountSecured) {
      return interaction.editReply("⚠️ Account must be secured before securing login.");
    }

    if (deal.loginSecured) {
      return interaction.editReply("⚠️ Login is already marked as secured.");
    }

    deal.loginSecured = true;
    deal.loginSecuredBy = interaction.user.id;
    deal.loginSecuredAt = new Date();

    await deal.save();

    await interaction.editReply("✅ **Login has been marked as secured.**");
  }
};
