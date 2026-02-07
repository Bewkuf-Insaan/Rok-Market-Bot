const Deal = require("../models/Deal");
const Listing = require("../models/Listing");
const { EmbedBuilder } = require("discord.js");

async function createDealChannel(client, guild, listing, buyerId, mmId, ticketCategoryId) {

  const channel = await guild.channels.create({
    name: `deal-${listing.listingId}`,
    parent: ticketCategoryId,
    permissionOverwrites: [
      { id: guild.id, deny: ["ViewChannel"] },
      { id: buyerId, allow: ["ViewChannel"] },
      { id: listing.sellerId, allow: ["ViewChannel"] },
      { id: mmId, allow: ["ViewChannel"] }
    ]
  });

  const dealId = `D-${Date.now()}`;

  const deal = await Deal.create({
    dealId,
    listingId: listing.listingId,
    guildId: guild.id,
    buyerId,
    sellerId: listing.sellerId,
    mmId,
    channelId: channel.id,
    status: "waiting_payment"
  });

  await Listing.findOneAndUpdate(
    { listingId: listing.listingId },
    { status: "in_deal" }
  );

  // ========================
  // DEAL SUMMARY EMBED
  // ========================

  const summaryEmbed = new EmbedBuilder()
    .setTitle("🧾 Deal Summary")
    .setColor(0x3498db)
    .addFields(
      { name: "Deal ID", value: dealId, inline: true },
      { name: "Listing ID", value: `#${listing.listingId}`, inline: true },
      { name: "Price", value: `$${listing.price}`, inline: true },
      { name: "MM", value: `${listing.mmName} (${listing.mmFee}%)`, inline: true },
      { name: "Buyer", value: `<@${buyerId}>`, inline: true },
      { name: "Seller", value: `<@${listing.sellerId}>`, inline: true },
      { name: "Status", value: "⏳ Waiting for Payment", inline: false }
    )
    .setTimestamp();

  const rulesEmbed = new EmbedBuilder()
    .setTitle("⚠ Important Rules")
    .setColor(0xe67e22)
    .setDescription(`
• Never deal in DMs
• MM fee is non-refundable
• Payment released after 24h hold
• Buyer must confirm login before hold
`);

  const checklistEmbed = new EmbedBuilder()
    .setTitle("📋 Deal Checklist")
    .setColor(0x2ecc71)
    .setDescription(`
⬜ Payment Received  
⬜ Account Verified  
⬜ Account Secured  
⬜ Buyer Login Confirmed  
⬜ 24h Hold Started  
⬜ Payment Released  
`);

  const sentMessage = await channel.send({
  content: `<@${buyerId}> <@${listing.sellerId}> <@${mmId}>`,
  embeds: [summaryEmbed, rulesEmbed, checklistEmbed]
});

// Save checklist message ID
deal.checklistMessageId = sentMessage.id;
await deal.save();

  return { channel, deal };
}

module.exports = {
  createDealChannel
};
