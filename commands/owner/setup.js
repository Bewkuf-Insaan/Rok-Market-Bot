const {
  SlashCommandBuilder,
  ChannelType
} = require("discord.js");

const Guild = require("../../models/Guild");
const { isOwner } = require("../../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Setup marketplace bot (Owner only)")

    .addChannelOption(opt =>
      opt.setName("ticket_category")
        .setDescription("Select ticket category")
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(true)
    )

    // PRICE CHANNELS
    .addChannelOption(opt =>
      opt.setName("p_100_250")
        .setDescription("100-250 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_250_500")
        .setDescription("250-500 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_500_1000")
        .setDescription("500-1000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_1000_2000")
        .setDescription("1000-2000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_2000_4000")
        .setDescription("2000-4000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_4000_8000")
        .setDescription("4000-8000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_8000_15000")
        .setDescription("8000-15000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_15000_30000")
        .setDescription("15000-30000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("p_above_30000")
        .setDescription("Above-30000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )

    // SOLD CHANNELS
    .addChannelOption(opt =>
      opt.setName("s_100_250")
        .setDescription("Sold 100-250 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_250_500")
        .setDescription("Sold 250-500 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_500_1000")
        .setDescription("Sold 500-1000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_1000_2000")
        .setDescription("Sold 1000-2000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_2000_4000")
        .setDescription("Sold 2000-4000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_4000_8000")
        .setDescription("Sold 4000-8000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_8000_15000")
        .setDescription("Sold 8000-15000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_15000_30000")
        .setDescription("Sold 15000-30000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("log_channel")
        .setDescription("Staff logs channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption(opt =>
      opt.setName("s_above_30000")
        .setDescription("Sold Above-30000 Channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {

    if (!isOwner(interaction.user.id))
      return interaction.reply({ content: "Not authorized.", ephemeral: true });

    const priceChannels = {
      "100-250": interaction.options.getChannel("p_100_250").id,
      "250-500": interaction.options.getChannel("p_250_500").id,
      "500-1000": interaction.options.getChannel("p_500_1000").id,
      "1000-2000": interaction.options.getChannel("p_1000_2000").id,
      "2000-4000": interaction.options.getChannel("p_2000_4000").id,
      "4000-8000": interaction.options.getChannel("p_4000_8000").id,
      "8000-15000": interaction.options.getChannel("p_8000_15000").id,
      "15000-30000": interaction.options.getChannel("p_15000_30000").id,
      "above-30000": interaction.options.getChannel("p_above_30000").id
    };

    const soldChannels = {
      "100-250": interaction.options.getChannel("s_100_250").id,
      "250-500": interaction.options.getChannel("s_250_500").id,
      "500-1000": interaction.options.getChannel("s_500_1000").id,
      "1000-2000": interaction.options.getChannel("s_1000_2000").id,
      "2000-4000": interaction.options.getChannel("s_2000_4000").id,
      "4000-8000": interaction.options.getChannel("s_4000_8000").id,
      "8000-15000": interaction.options.getChannel("s_8000_15000").id,
      "15000-30000": interaction.options.getChannel("s_15000_30000").id,
      "above-30000": interaction.options.getChannel("s_above_30000").id
    };

    await Guild.findOneAndUpdate(
      { guildId: interaction.guild.id },
      {
        guildId: interaction.guild.id,
        ticketCategoryId: interaction.options.getChannel("ticket_category").id,
        logChannelId: interaction.options.getChannel("log_channel").id,
        priceChannels,
        soldChannels
      },
      { upsert: true }
    );

    await interaction.reply("✅ Setup completed successfully.");
  }
};
