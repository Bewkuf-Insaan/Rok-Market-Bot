const { EmbedBuilder } = require("discord.js");

module.exports = (listingId, sellType, data) => {
  const price = Number(data.price || 0);
  const mmFee = Number(data.mmFee || 0);
  const totalPayable = Math.round((price + mmFee) * 100) / 100;

  // =========================
  // ACCOUNT EMBED
  // =========================
  if (sellType === "account") {
    return new EmbedBuilder()
      .setTitle(`#WTS | Account | Listing #${listingId}`)
      .setColor(0x2ecc71)
      .addFields(
        { name: "Account Kingdom Season", value: data.seasonTag || "N/A" },
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

        { name: "Price", value: `$${price}`, inline: true },
        { name: "MM Fee (10%)", value: `$${mmFee}`, inline: true },
        { name: "Total Payable", value: `$${totalPayable}`, inline: true }
      )
      .setFooter({ text: "Click Buy to start deal" })
      .setTimestamp();
  }

  // =========================
  // RESOURCE EMBED
  // =========================
  if (sellType === "resources") {
    return new EmbedBuilder()
      .setTitle(`#WTS | Resources | Listing #${listingId}`)
      .setColor(0xf1c40f)
      .addFields(
        { name: "Food", value: data.food || "0", inline: true },
        { name: "Wood", value: data.wood || "0", inline: true },
        { name: "Stone", value: data.stone || "0", inline: true },
        { name: "Gold", value: data.gold || "0", inline: true },

        { name: "Kingdom", value: data.kingdom || "N/A" },
        { name: "Migratable", value: data.migratable || "N/A" },

        { name: "Price", value: `$${price}`, inline: true },
        { name: "MM Fee (10%)", value: `$${mmFee}`, inline: true },
        { name: "Total Payable", value: `$${totalPayable}`, inline: true }
      )
      .setFooter({ text: "Click Buy to start deal" })
      .setTimestamp();
  }

  // =========================
  // KINGDOM EMBED
  // =========================
  if (sellType === "kingdom") {
    return new EmbedBuilder()
      .setTitle(`#WTS | Kingdom | Listing #${listingId}`)
      .setColor(0x9b59b6)
      .addFields(
        { name: "Season", value: data.season || "N/A" },
        { name: "Kingdom", value: data.kingdom || "N/A" },
        { name: "Main Alliance (Zone 3)", value: data.mainAlliance || "N/A" },
        { name: "Farm Alliances", value: data.farmAlliance || "N/A" },
        { name: "Alliances Provided", value: data.provideAlliance || "N/A" },
        { name: "Migration Status", value: data.migration || "N/A" },
        { name: "Rebels", value: data.rebels || "N/A" },

        { name: "Price", value: `$${price}`, inline: true },
        { name: "MM Fee (10%)", value: `$${mmFee}`, inline: true },
        { name: "Total Payable", value: `$${totalPayable}`, inline: true }
      )
      .setFooter({ text: "Click Buy to start deal" })
      .setTimestamp();
  }

  // =========================
  // SAFETY FALLBACK
  // =========================
  return new EmbedBuilder()
    .setTitle(`Listing #${listingId}`)
    .setDescription("Invalid listing type.");
};
