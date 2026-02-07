const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");
const { isMM } = require("../../utils/permissions");
const { updateChecklist } = require("../../services/checklistService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("confirmpayment")
    .setDescription("Confirm payment received"),

  async execute(interaction, client) {

    if (!isMM(interaction.user.id))
      return interaction.reply({ content: "Only MM can use this.", ephemeral: true });

    const deal = await Deal.findOne({ channelId: interaction.channel.id });
    if (!deal)
      return interaction.reply({ content: "No active deal found.", ephemeral: true });

    deal.status = "account_check";
    await deal.save();

    await updateChecklist(client, deal);

    await interaction.reply("✅ Payment confirmed. Seller send account access.");
  }
};
