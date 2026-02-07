const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");
const Listing = require("../../models/Listing");
const { isMM } = require("../../utils/permissions");
const { updateChecklist } = require("../../services/checklistService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("canceldeal")
    .setDescription("Cancel current deal")
    .addStringOption(opt =>
      opt.setName("reason")
        .setDescription("Reason for cancellation")
        .setRequired(true)
    ),

  async execute(interaction, client) {

    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal)
      return interaction.reply({ content: "No active deal found.", ephemeral: true });

    const isParticipant =
      interaction.user.id === deal.buyerId ||
      interaction.user.id === deal.sellerId ||
      isMM(interaction.user.id);

    if (!isParticipant)
      return interaction.reply({ content: "You are not part of this deal.", ephemeral: true });

    const reason = interaction.options.getString("reason");

    deal.status = "cancelled";
    await deal.save();

    // Reopen listing
    await Listing.findOneAndUpdate(
      { listingId: deal.listingId },
      { status: "available" }
    );

    await updateChecklist(client, deal);

    await interaction.reply(
      `❌ Deal cancelled.\nReason: ${reason}\nListing reopened.`
    );

    const { generateTranscript } = require("../../services/transcriptService");

const transcript = await generateTranscript(interaction.channel);

if (transcript) {
  const owner = await interaction.guild.fetchOwner();
  await owner.send({
    content: `📜 Transcript for cancelled deal #${deal.listingId}`,
    files: [transcript]
  });
}

    if (guildConfig.logChannelId) {
  const logChannel = await interaction.guild.channels.fetch(guildConfig.logChannelId);
  if (logChannel) {
    await logChannel.send({
      content: `✅ Deal Completed\nListing: #${deal.listingId}\nBuyer: <@${deal.buyerId}>\nSeller: <@${deal.sellerId}>`,
      files: transcript ? [transcript] : []
    });
  }
}


    // Lock ticket
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
      ViewChannel: false
    });

  }
};
