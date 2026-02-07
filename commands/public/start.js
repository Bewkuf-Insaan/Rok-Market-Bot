const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Start buying or selling"),

  async execute(interaction) {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("seller")
        .setLabel("Seller")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("buyer")
        .setLabel("Buyer")
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      content: "Are you a buyer or seller?",
      components: [row],
      ephemeral: true
    });
  }
};
