const { SlashCommandBuilder } = require("discord.js");

const Listing = require("../../models/Listing");
const Deal = require("../../models/Deal");
const Draft = require("../../models/Draft");
const Guild = require("../../models/Guild");
const MMProfile = require("../../models/MMProfile");

module.exports = {
  // 👇 THIS makes it guild-only
  guildOnly: true,

  data: new SlashCommandBuilder()
    .setName("reset-bot")
    .setDescription("⚠️ Reset ALL bot data (owner only)")
    .addStringOption(option =>
      option
        .setName("confirm")
        .setDescription('Type "RESET" to confirm')
        .setRequired(true)
    ),

  async execute(interaction) {
    // 🔒 OWNER LOCK (Railway variable)
    if (interaction.user.id !== process.env.OWNER_ID) {
      return interaction.reply({
        content: "❌ You are not authorized to use this command.",
        ephemeral: true
      });
    }

    const confirm = interaction.options.getString("confirm");
    if (confirm !== "RESET") {
      return interaction.reply({
        content: '❌ Confirmation failed. Type **RESET** exactly.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      await Promise.all([
        Listing.deleteMany({}),
        Deal.deleteMany({}),
        Draft.deleteMany({}),
        Guild.deleteMany({}),
        MMProfile.deleteMany({})
      ]);

      await interaction.editReply(
        "✅ **Bot reset successful.**\nAll bot data has been wiped.\n\nRun `/setup` again."
      );
    } catch (err) {
      console.error("RESET BOT ERROR:", err);
      await interaction.editReply("❌ Reset failed. Check logs.");
    }
  }
};
