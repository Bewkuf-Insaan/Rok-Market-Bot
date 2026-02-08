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

    // =========================
    // MM ONLY
    // =========================
    if (!isMM(interaction.user.id)) {
      return interaction.reply({
        content: "❌ Only MM can use this command.",
        ephemeral: true
      });
    }

    // =========================
    // FIND DEAL
    // =========================
    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal) {
      return interaction.reply({
        content: "❌ No active deal found in this channel.",
        ephemeral: true
      });
    }

    // =========================
    // PREVENT DOUBLE RELEASE
    // =========================
    if (deal.status === "completed") {
      return interaction.reply({
        content: "⚠ This deal is already completed.",
        ephemeral: true
      });
    }

    // =========================
    // FETCH LISTING & CONFIG
    // =========================
    const listing = await Listing.findOne({ listingId: deal.listingId });
    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    if (!listing || !guildConfig) {
      return interaction.reply({
        content: "❌ Configuration error. Listing or guild config missing.",
        ephemeral: true
      });
    }

    // =========================
    // COMPLETE DEAL
    // =========================
    deal.status = "completed";
    await deal.save();

    listing.status = "sold";
    await listing.save();

    // =========================
    // REMOVE BUTTONS FROM ORIGINAL LISTING
    // =========================
    try {
      const channel = await client.channels.fetch(listing.channelId);
      const message = await channel.messages.fetch(listing.messageId);
      await message.edit({ components: [] });
    } catch (err) {
      console.warn("Listing message already removed or inaccessible.");
    }

    // =========================
    // MOVE TO SOLD CHANNEL
    // =========================
    await markListingAsSold(client, listing, guildConfig);

    // =========================
    // UPDATE CHECKLIST
    // =========================
    await updateChecklist(client, deal);

    await interaction.reply(
      "✅ **Deal completed successfully.**\nPayment released and listing moved to **SOLD**."
    );

    // =========================
    // TRANSCRIPT
    // =========================
    const transcript = await generateTranscript(interaction.channel);

    // DM owner transcript
    if (transcript) {
      try {
        const owner = await interaction.guild.fetchOwner();
        await owner.send({
          content: `📜 Transcript for completed deal #${deal.listingId}`,
          files: [transcript]
        });
      } catch (err) {
        console.warn("Could not DM owner transcript.");
      }
    }

    // =========================
    // LOG CHANNEL
    // =========================
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
        console.warn("Failed to log deal.");
      }
    }

    // =========================
    // MM STATS
    // =========================
    await MMProfile.findOneAndUpdate(
      { userId: deal.mmId },
      { $inc: { completedDeals: 1 } },
      { upsert: true }
    );

    // =========================
    // LOCK & DELETE TICKET
    // =========================
    try {
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.id,
        { ViewChannel: false }
      );
    } catch {}

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.warn("Ticket already deleted.");
      }
    }, 3000);
  }
};
