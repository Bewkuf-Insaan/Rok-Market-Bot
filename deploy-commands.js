require("dotenv").config();

const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");

const commands = [];

// =======================
// RECURSIVE COMMAND LOADER
// =======================

const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);

    if (fs.lstatSync(filePath).isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith(".js")) {

      const command = require(filePath);

      if (!command.data) {
        console.log(`⚠ Skipping invalid command file: ${file}`);
        continue;
      }

      console.log(`🔍 Checking command: ${command.data.name}`);

      try {
        const json = command.data.toJSON(); // Validate command
        commands.push(json);
        console.log(`✅ Prepared command: ${command.data.name}`);
      } catch (err) {
        console.error(`❌ Error in command: ${command.data.name}`);
        console.error(err);
        process.exit(1); // Stop immediately if error found
      }
    }
  }
};

loadCommands(path.join(__dirname, "commands"));


// =======================
// REGISTER COMMANDS
// =======================

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log("🔄 Registering slash commands...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Successfully registered global slash commands.");
  } catch (error) {
    console.error("❌ Error registering commands:");
    console.error(error);
  }
})();
