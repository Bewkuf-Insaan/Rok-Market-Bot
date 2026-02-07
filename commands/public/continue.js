const { SlashCommandBuilder } = require("discord.js");
const Draft = require("../../models/Draft");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("continue")
    .setDescription("Continue seller setup"),

  async execute(interaction) {

    const draft = await Draft.findOne({ userId: interaction.user.id });

    if (!draft) {
      return interaction.reply({
        content: "No draft found.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content: "Check your DMs to continue.",
      ephemeral: true
    });

    await interaction.user.send("Resuming your seller setup...");
  }
};
