const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");
const { isMM } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("starthold")
    .setDescription("Start 24-hour hold period"),

  async execute(interaction) {

    if (!isMM(interaction.user.id))
      return interaction.reply({ content: "Only MM can use this.", ephemeral: true });

    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal)
      return interaction.reply({ content: "No active deal found.", ephemeral: true });

    if (deal.holdUntil)
      return interaction.reply({ content: "Hold already started.", ephemeral: true });

    const holdUntil = new Date();
    holdUntil.setHours(holdUntil.getHours() + 24);

    deal.status = "hold_24h";
    deal.holdUntil = holdUntil;

    await deal.save();
    const { updateChecklist } = require("../../services/checklistService");

    await updateChecklist(client, deal);
    await interaction.reply(
      `⏳ 24-hour hold started.\nPayment can be released after: <t:${Math.floor(holdUntil.getTime() / 1000)}:F>`
    );
  }
};
