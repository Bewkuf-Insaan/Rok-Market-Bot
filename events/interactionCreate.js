const { startSellerDraft } = require("../services/sellerFlow");
const { checkSubscription } = require("../services/subscriptionService");

module.exports = {
  name: "interactionCreate",

  async execute(interaction, client) {

    // Slash Commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {

        // Check subscription for public commands
        if (interaction.commandName !== "addsub" && interaction.commandName !== "setup") {
          const validSub = await checkSubscription(interaction.guild.id);
          if (!validSub) {
            return interaction.reply({
              content: "❌ This server does not have an active subscription.",
              ephemeral: true
            });
          }
        }

        await command.execute(interaction, client);

      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error executing this command.",
          ephemeral: true
        });
      }
    }

    // Buttons (Seller / Buyer)
    if (interaction.isButton()) {

      if (interaction.customId === "seller") {

        await startSellerDraft(interaction.user.id, interaction.guild.id);

        await interaction.reply({
          content: "📩 Check your DMs to continue seller setup.",
          ephemeral: true
        });

        await interaction.user.send("Welcome Seller!\n\nPlease enter Kingdom:");
      }

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

  await interaction.user.send("Enter your budget in USD (numbers only):");
}

    }
  }
};
