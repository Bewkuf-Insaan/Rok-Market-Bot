const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const MMProfile = require("../../models/MMProfile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mm-info")
    .setDescription("View Middleman Information"),

  async execute(interaction) {

    const mms = await MMProfile.find();

    if (!mms.length)
      return interaction.reply("No MM information found.");

    const embeds = mms.map(mm => {

      return new EmbedBuilder()
        .setTitle(`🛡 MM: ${mm.name}`)
        .setColor(0x3498db)
        .addFields(
          { name: "Discord", value: `<@${mm.userId}>`, inline: true },
          { name: "Country", value: mm.country, inline: true },
          { name: "WhatsApp", value: mm.whatsapp, inline: true },
          { name: "Accounts Helped", value: `${mm.completedDeals}`, inline: false }
        )
        .setTimestamp();
    });

    await interaction.reply({ embeds });
  }
};
