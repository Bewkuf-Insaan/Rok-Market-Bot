const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

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
      opt
        .setName("reason")
        .setDescription("Reason for cancellation")
        .setRequired(true)
    ),

  async execute(interaction, client) {

    // =========================
    // FIND DEAL
    // =========================
    const deal = await Deal.findOne({ channelId: interaction.channel.id });

    if (!deal) {
      return interaction.reply({
        content: "No active deal found.",
        ephemeral: true
      });
    }

    // =========================
    // PERMISSION CHECK
    // =========================
    const isParticipant =
      interaction.user.id === deal.buyerId ||
      interaction.user.id === deal.sellerId ||
      isMM(interaction.user.id);

    if (!isParticipant) {
      return interaction.reply({
        content: "You are not part of this deal.",
        ephemeral: true
      });
    }

    const reason = interaction.options.getString("reason");

    // =========================
    // CANCEL DEAL
    // =========================
    deal.status = "cancelled";
    await deal.save();

    // =========================
    // REVERT LISTING TO AVAILABLE
    // =========================
    const listing = await Listing.findOne({ listingId: deal.listingId });

    if (listing) {
      listing.status = "available";
      listing.buyerId = null;
      listing.dealId = null;
      await listing.save();

      // =========================
      // RESTORE LISTING MESSAGE
      // =========================
      try {
        const channel = await client.channels.fetch(listing.channelId);
        const message = await channel.messages.fetch(listing.messageId);

        const embed = message.embeds[0];
        if (embed) {
          const revertedEmbed = {
            ...embed.data,
            color: 0x2ECC71,
            fields: [
              ...embed.fields.filter(f => f.name !== "Status"),
              { name: "Status", value: "🟢 Available", inline: true }
            ]
          };

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`buy_${listing.listingId}`)
              .setLabel("🛒 Buy Now")
              .setStyle(ButtonStyle.Success)
          );

          await message.edit({
            embeds: [revertedEmbed],
            components: [row]
          });
        }
      } catch (err) {
        console.warn("Failed to restore listing after cancel.");
      }
    }

    // =========================
    // UPDATE CHECKLIST
    // =========================
    await updateChecklist(client, deal);

    await interaction.reply(
      `❌ **Deal cancelled.**\nReason: ${reason}\nListing reopened.`
    );

    // =========================
    // TRANSCRIPT
    // =========================
    const transcript = await generateTranscript(interaction.channel);

    if (transcript) {
      try {
        const owner = await interaction.guild.fetchOwner();
        await owner.send({
          content: `📜 Transcript for cancelled deal #${deal.listingId}`,
          files: [transcript]
        });
      } catch {}
    }

    // =========================
    // LOG CHANNEL
    // =========================
    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    if (guildConfig?.logChannelId) {
      try {
        const logChannel = await interaction.guild.channels.fetch(
          guildConfig.logChannelId
        );

        if (logChannel) {
          await logChannel.send({
            content:
              `❌ **Deal Cancelled**\n` +
              `Listing: #${deal.listingId}\n` +
              `Buyer: <@${deal.buyerId}>\n` +
              `Seller: <@${deal.sellerId}>\n` +
              `Reason: ${reason}`,
            files: transcript ? [transcript] : []
          });
        }
      } catch {}
    }

    // =========================
    // CLOSE TICKET
    // =========================
    try {
      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone.id,
        { ViewChannel: false }
      );
    } catch {}

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (err) {
        console.error("Ticket delete error:", err);
      }
    }, 3000);
  }
};
