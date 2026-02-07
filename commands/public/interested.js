const { SlashCommandBuilder } = require("discord.js");
const Listing = require("../../models/Listing");
const Guild = require("../../models/Guild");
const mmList = require("../../config/mmList");
const { createDealChannel } = require("../../services/ticketService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("interested")
    .setDescription("Start a deal with a listing")
    .addIntegerOption(opt =>
      opt.setName("listingid")
        .setDescription("Listing ID")
        .setRequired(true)
    ),

  async execute(interaction, client) {

    const listingId = interaction.options.getInteger("listingid");

    const listing = await Listing.findOne({ listingId });

    if (!listing)
      return interaction.reply({ content: "Listing not found.", ephemeral: true });

    if (listing.status !== "available")
      return interaction.reply({ content: "Listing not available.", ephemeral: true });

    const guildConfig = await Guild.findOne({ guildId: interaction.guild.id });

    const mmId = mmList[listing.mmName].id;

    const { channel } = await createDealChannel(
      client,
      interaction.guild,
      listing,
      interaction.user.id,
      mmId,
      guildConfig.ticketCategoryId
    );

    await interaction.reply({
      content: `Deal created: ${channel}`,
      ephemeral: true
    });
  }
};
