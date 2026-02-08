const { SlashCommandBuilder } = require("discord.js");
const Deal = require("../../models/Deal");
const Listing = require("../../models/Listing");
const Guild = require("../../models/Guild");
const MMProfile = require("../../models/MMProfile");
const { isMM } = require("../../utils/permissions");
const { markListingAsSold } = require("../../services/listingService");
const { updateChecklist } = require("../../services/checklistService");
const { generateTranscript } = require("../../services/transcriptService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("releasepayment")
    .setDescription("Release payment and complete deal"),

  async execute(interaction, client) {
    // MM only
    if (!isMM(interaction.user.id)) {
      return interaction.reply({
        content: "Only MM can use this command.",
        ephemeral: true
      });
    }

    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal) {
      return interaction.reply({
        content: "No active deal found in this channel.",
        ephemeral: true
      });
    }

    const listing = await Listing.findOne({ listingId: deal.listingId });
    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    if (!listing || !guildConfig) {
      return interaction.reply({
        content: "Configuration error. Listing or guild config missing.",
        ephemeral: true
      });
    }

    // ✅ COMPLETE DEAL (NO HOLD CHECK)
    deal.status = "completed";
    await deal.save();

    listing.status = "sold";
    await listing.save();

    // Remove buttons from listing message
    try {
      const channel = await interaction.client.channels.fetch(listing.channelId);
      const message = await channel.messages.fetch(listing.messageId);
      await message.edit({ components: [] });
    } catch (err) {
      console.error("Failed to update listing message:", err);
    }

    // Move listing / mark sold
    await markListingAsSold(client, listing, guildConfig);

    // Update checklist
    await updateChecklist(client, deal);

    await interaction.reply(
      "✅ Deal completed. Payment released and listing marked **SOLD**."
    );

    // Generate transcript
    const transcript = await generateTranscript(interaction.channel);

    if (transcript) {
      try {
        const owner = await interaction.guild.fetchOwner();
        await owner.send({
          content: `📜 Transcript for completed deal #${deal.listingId}`,
          files: [transcript]
        });
      } catch (err) {
        console.error("Failed to DM owner transcript:", err);
      }
    }

    // Log channel
    if (guildConfig.logChannelId) {
      try {
        const logChannel = await interaction.guild.channels.fetch(
          guildConfig.logChannelId
        );

        if (logChannel) {
          await logChannel.send({
            content:
              `✅ **Deal Completed**\n` +
              `Listing: #${deal.listingId}\n` +
              `Buyer: <@${deal.buyerId}>\n` +
              `Seller: <@${deal.sellerId}>\n` +
              `MM: <@${deal.mmId}>`,
            files: transcript ? [transcript] : []
          });
        }
      } catch (err) {
        console.error("Failed to log deal:", err);
      }
    }

    // Increase MM completed deals
    await MMProfile.findOneAndUpdate(
      { userId: deal.mmId },
      { $inc: { completedDeals: 1 } },
      { upsert: true }
    );

    // Lock ticket
    await interaction.channel.permissionOverwrites.edit(
      interaction.guild.id,
      { ViewChannel: false }
    );

    // Delete channel after 3 seconds
    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error("Ticket delete error:", err);
      }
    }, 3000);
  }
};
