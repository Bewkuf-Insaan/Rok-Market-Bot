const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");
const Listing = require("../../models/Listing");
const Guild = require("../../models/Guild");
const { isMM } = require("../../utils/permissions");
const { markListingAsSold } = require("../../services/listingService");
const MMProfile = require("../../models/MMProfile");


module.exports = {
  data: new SlashCommandBuilder()
    .setName("releasepayment")
    .setDescription("Release payment and complete deal"),

  async execute(interaction, client) {

    if (!isMM(interaction.user.id))
      return interaction.reply({ content: "Only MM can use this.", ephemeral: true });

    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal)
      return interaction.reply({ content: "No active deal found.", ephemeral: true });

    if (!deal.holdUntil)
      return interaction.reply({ content: "24-hour hold not started yet.", ephemeral: true });

    if (new Date() < deal.holdUntil) {
      const remaining = Math.floor((deal.holdUntil - new Date()) / 1000 / 60);
      return interaction.reply({
        content: `⏳ Cannot release yet. ${remaining} minutes remaining.`,
        ephemeral: true
      });
    }

    const listing = await Listing.findOne({ listingId: deal.listingId });
    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    if (!listing || !guildConfig)
      return interaction.reply({ content: "Configuration error.", ephemeral: true });

    deal.status = "completed";
    await deal.save();

    listing.status = "sold";
    await listing.save();
const channel = await interaction.client.channels.fetch(listing.channelId);
const message = await channel.messages.fetch(listing.messageId);

await message.edit({
  components: [] // remove button
});

    await markListingAsSold(client, listing, guildConfig);
    const { updateChecklist } = require("../../services/checklistService");

    await updateChecklist(client, deal);
    await interaction.reply("✅ Deal completed. Payment released and listing marked SOLD.");

    const { generateTranscript } = require("../../services/transcriptService");

// Generate transcript
const transcript = await generateTranscript(interaction.channel);

if (transcript) {
  const owner = await interaction.guild.fetchOwner();
  await owner.send({
    content: `📜 Transcript for completed deal #${deal.listingId}`,
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
// Increase MM completed deals
await MMProfile.findOneAndUpdate(
  { userId: deal.mmId },
  { $inc: { completedDeals: 1 } }
);

    // Lock ticket
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
      ViewChannel: false
    });
  }
};
