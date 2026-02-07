const { EmbedBuilder } = require("discord.js");

function buildListingEmbed(listingId, data, status = "🟢 Available") {

  return new EmbedBuilder()
    .setTitle(`ID - #${listingId}`)
    .setColor(status === "🟢 Available" ? 0x2ecc71 : 0xe74c3c)
    .addFields(
      { name: "Kingdom", value: data.kingdom || "N/A", inline: true },
      { name: "Power", value: data.power || "N/A", inline: true },
      { name: "Kills", value: data.kills || "N/A", inline: true },
      { name: "VIP", value: data.vip || "N/A", inline: true },
      { name: "Castle", value: data.castle || "N/A", inline: true },
      { name: "Price", value: `$${data.price}`, inline: true },
      { name: "MM", value: `${data.mm} (${data.mmFee}%)`, inline: true },
      { name: "Status", value: status, inline: false }
    )
    .setTimestamp();
}

module.exports = buildListingEmbed;
