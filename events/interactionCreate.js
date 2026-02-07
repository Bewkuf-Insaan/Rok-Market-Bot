const { startSellerDraft } = require("../services/sellerFlow");
const { checkSubscription } = require("../services/subscriptionService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    // ==============================
    // SLASH COMMANDS
    // ==============================
    if (interaction.isChatInputCommand()) {

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {

        // ✅ Only check subscription inside guild
        if (interaction.guild) {
          if (
            interaction.commandName !== "addsub" &&
            interaction.commandName !== "setup"
          ) {
            const validSub = await checkSubscription(interaction.guild.id);
            if (!validSub) {
              return interaction.reply({
                content: "❌ This server does not have an active subscription.",
                ephemeral: true
              });
            }
          }
        }

        await command.execute(interaction, client);

      } catch (error) {
        console.error(error);

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: "There was an error executing this command.",
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: "There was an error executing this command.",
            ephemeral: true
          });
        }
      }
    }

    // ==============================
    // BUTTON INTERACTIONS
    // ==============================
    if (interaction.isButton()) {

      // ❌ If button clicked in DM, ignore
      if (!interaction.guild) {
        return interaction.reply({
          content: "Please use buttons inside the server.",
          ephemeral: true
        });
      }

      // =========================
      // SELLER BUTTON
      // =========================
      if (interaction.customId === "seller") {

        await startSellerDraft(interaction.user.id, interaction.guild.id);

        await interaction.reply({
          content: "📩 Check your DMs to continue seller setup.",
          ephemeral: true
        });

        await interaction.user.send(
          "Welcome Seller!\n\nPlease enter Kingdom:"
        );
      }

      // =========================
      // BUYER BUTTON
      // =========================
      if (interaction.customId === "buyer") {

        const Draft = require("../models/Draft");

        await Draft.findOneAndUpdate(
          { userId: interaction.user.id },
          {
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            role: "buyer",
            step: 1,
            data: {}
          },
          { upsert: true }
        );

        await interaction.reply({
          content: "📩 Check your DMs to continue buyer process.",
          ephemeral: true
        });

        await interaction.user.send(
          "Enter your budget in USD (numbers only):"
        );
      }

      // ==========================
// BUY LISTING BUTTON
// ==========================
if (interaction.customId.startsWith("buy_")) {

  const listingId = parseInt(interaction.customId.split("_")[1]);

  const Listing = require("../models/Listing");
  const Guild = require("../models/Guild");
  const Deal = require("../models/Deal");

  const listing = await Listing.findOne({ listingId });

  if (!listing || listing.status !== "available") {
    return interaction.reply({
      content: "❌ This listing is no longer available.",
      ephemeral: true
    });
  }

  // 🔒 Lock listing (anti double deal)
  listing.status = "in_deal";
await listing.save();

// 🔒 Disable Buy Button
const channel = await client.channels.fetch(listing.channelId);
const message = await channel.messages.fetch(listing.messageId);

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const disabledRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId(`buy_${listingId}`)
    .setLabel("🔒 In Deal")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(true)
);

await message.edit({
  components: [disabledRow]
});


  const guild = await Guild.findOne({ guildId: listing.guildId });

  const guildObj = await client.guilds.fetch(listing.guildId);

  const ticket = await guildObj.channels.create({
    name: `deal-${listingId}`,
    type: 0,
    parent: guild.ticketCategoryId,
    permissionOverwrites: [
      {
        id: guildObj.roles.everyone.id,
        deny: ["ViewChannel"]
      },
      {
        id: listing.sellerId,
        allow: ["ViewChannel", "SendMessages"]
      },
      {
        id: interaction.user.id,
        allow: ["ViewChannel", "SendMessages"]
      },
      {
        id: require("../config/mmList")[listing.mmName].id,
        allow: ["ViewChannel", "SendMessages"]
      }
    ]
  });

  await ticket.send(
    `🛡 Deal Started for Listing #${listingId}\n\n` +
    `Buyer: <@${interaction.user.id}>\n` +
    `Seller: <@${listing.sellerId}>\n` +
    `MM: <@${require("../config/mmList")[listing.mmName].id}>`
  );

  await Deal.create({
    listingId,
    guildId: listing.guildId,
    buyerId: interaction.user.id,
    sellerId: listing.sellerId,
    mmId: require("../config/mmList")[listing.mmName].id,
    status: "started",
    createdAt: new Date()
  });

  await interaction.reply({
    content: `✅ Deal ticket created: ${ticket}`,
    ephemeral: true
  });
}
    }
  }
};
