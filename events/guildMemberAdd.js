module.exports = {
  name: "guildMemberAdd",

  async execute(member) {
    try {
      await member.send(
        `👋 Welcome to ${member.guild.name}!

If you want to BUY or SELL an account,
run the command:

/start

⚠ Never deal in DMs.
All transactions must go through tickets.`
      );
    } catch (err) {
      console.log("Could not send welcome DM.");
    }
  }
};
