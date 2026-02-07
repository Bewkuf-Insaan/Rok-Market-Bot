const Deal = require("../models/Deal");
const { EmbedBuilder } = require("discord.js");

async function updateChecklist(client, deal, updates = {}) {

  const channel = await client.channels.fetch(deal.channelId);
  const message = await channel.messages.fetch(deal.checklistMessageId);

  if (!message) return;

  const checklistState = {
    payment: deal.status !== "waiting_payment",
    verified: deal.status !== "waiting_payment",
    secured: deal.status === "secured" || deal.status === "login_confirmed" || deal.status === "hold_24h" || deal.status === "completed",
    login: deal.status === "login_confirmed" || deal.status === "hold_24h" || deal.status === "completed",
    hold: deal.status === "hold_24h" || deal.status === "completed",
    released: deal.status === "completed"
  };

  const checklistEmbed = new EmbedBuilder()
    .setTitle("📋 Deal Checklist")
    .setColor(0x2ecc71)
    .setDescription(`
${checklistState.payment ? "✅" : "⬜"} Payment Received  
${checklistState.verified ? "✅" : "⬜"} Account Verified  
${checklistState.secured ? "✅" : "⬜"} Account Secured  
${checklistState.login ? "✅" : "⬜"} Buyer Login Confirmed  
${checklistState.hold ? "✅" : "⬜"} 24h Hold Started  
${checklistState.released ? "✅" : "⬜"} Payment Released  
`);

  const embeds = message.embeds;

  await message.edit({
    embeds: [embeds[0], embeds[1], checklistEmbed]
  });
}

module.exports = {
  updateChecklist
};
