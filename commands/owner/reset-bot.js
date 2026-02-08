const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const Listing = require("../../models/Listing");
const Deal = require("../../models/Deal");
const Draft = require("../../models/Draft");
const Guild = require("../../models/Guild");
const MMProfile = require("../../models/MMProfile");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset-bot")
    .setDescription("⚠️ Reset ALL bot data (admin only)")
    .addStringOption(option =>
      option
        .setName("confirm")
        .setDescription('Type "RESET" to confirm')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const confirm = interaction.options.getString("confirm");

    // Safety check
    if (confirm !== "RESET") {
      return interaction.reply({
        content: '❌ Confirmation failed. Type **RESET** exactly to proceed.',
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
        "✅ **Bot reset successful.**\nAll listings, deals, drafts, configs, and MM data have been cleared.\n\n🛠 Run `/setup` again to reconfigure the server."
      );
    } catch (err) {
      console.error("RESET BOT ERROR:", err);

      await interaction.editReply(
        "❌ Reset failed. Check console logs for details."
      );
    }
  }
};
