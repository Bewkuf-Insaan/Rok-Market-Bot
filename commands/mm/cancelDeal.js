const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Deal = require("../../models/Deal");
const Listing = require("../../models/Listing");
const Guild = require("../../models/Guild");
const { isMM } = require("../../utils/permissions");
const { updateChecklist } = require("../../services/checklistService");
const { generateTranscript } = require("../../services/transcriptService");

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
      return interaction.reply({
        content: "No active deal found.",
        ephemeral: true
      });

    const isParticipant =
      interaction.user.id === deal.buyerId ||
      interaction.user.id === deal.sellerId ||
      isMM(interaction.user.id);

    if (!isParticipant)
      return interaction.reply({
        content: "You are not part of this deal.",
        ephemeral: true
      });

    const reason = interaction.options.getString("reason");

    // Update deal
    deal.status = "cancelled";
    await deal.save();

    // Reopen listing
    const listing = await Listing.findOneAndUpdate(
      { listingId: deal.listingId },
      { status: "available" },
      { new: true }
    );

    // 🔓 Re-enable Buy Button
    if (listing) {
      const channel = await client.channels.fetch(listing.channelId);
      const message = await channel.messages.fetch(listing.messageId);

      const enabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_${listing.listingId}`)
          .setLabel("🛒 Buy Now")
          .setStyle(ButtonStyle.Success)
      );

      await message.edit({
        components: [enabledRow]
      });
    }

    await updateChecklist(client, deal);

    await interaction.reply(
      `❌ Deal cancelled.\nReason: ${reason}\nListing reopened.`
    );

    // Generate transcript
    const transcript = await generateTranscript(interaction.channel);

    // Send transcript to owner
    if (transcript) {
      const owner = await interaction.guild.fetchOwner();
      await owner.send({
        content: `📜 Transcript for cancelled deal #${deal.listingId}`,
        files: [transcript]
      });
    }

    // Send to log channel
    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    if (guildConfig?.logChannelId) {
      const logChannel = await interaction.guild.channels.fetch(guildConfig.logChannelId);

      if (logChannel) {
        await logChannel.send({
          content:
            `❌ Deal Cancelled\n` +
            `Listing: #${deal.listingId}\n` +
            `Buyer: <@${deal.buyerId}>\n` +
            `Seller: <@${deal.sellerId}>\n` +
            `Reason: ${reason}`,
          files: transcript ? [transcript] : []
        });
      }
    }

    // Lock ticket
    await interaction.channel.permissionOverwrites.edit(
      interaction.guild.roles.everyone.id,
      { ViewChannel: false }
    );
    setTimeout(async () => {
  try {
    await interaction.channel.delete();
  } catch (err) {
    console.error("Ticket delete error:", err);
  }
}, 3000); // delete after 3 seconds

  }
};

