const { EmbedBuilder } = require("discord.js");

module.exports = (listingId, data) => {

  return new EmbedBuilder()
    .setTitle(`#WTS | Listing #${listingId}`)
    .setColor(0x2ecc71)
    .addFields(
      { name: "Account Tag Season", value: data.seasonTag || "N/A" },
      { name: "Account Details Tag", value: data.detailsTag || "N/A" },
      { name: "Kingdom", value: data.kingdom || "N/A", inline: true },
      { name: "Account Age", value: data.accountAge || "N/A", inline: true },
      { name: "Power", value: data.power || "N/A", inline: true },
      { name: "Kill Points / Death", value: data.kills || "N/A" },
      { name: "VIP", value: data.vip || "N/A", inline: true },
      { name: "Castle Level", value: data.castle || "N/A", inline: true },
      { name: "Passport / Alliance Coin", value: data.passport || "N/A" },
      { name: "Legendary Commanders", value: data.commanders || "N/A" },
      { name: "Legendary Equipment", value: data.equipment || "N/A" },
      { name: "Legendary City Skin", value: data.citySkin || "N/A" },
      { name: "Goldhead", value: data.goldhead || "N/A" },
      { name: "Account Bind", value: data.bind || "N/A" },
      { name: "Receipts", value: data.receipts || "N/A" },
      { name: "VIP Access", value: data.vipAccess || "N/A" },
      { name: "Price", value: `$${data.price}` },
      { name: "MM Fee", value: `$${data.mmFee}` }
    )
    .setFooter({ text: "Use /interested LISTING_ID to start deal" })
    .setTimestamp();
};
