require("dotenv").config();

const { 
  Client, 
  GatewayIntentBits, 
  Collection, 
  Partials 
} = require("discord.js");

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");


// =======================
// CREATE CLIENT
// =======================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [
    Partials.Channel // Needed for DM handling
  ]
});

client.commands = new Collection();


// =======================
// CONNECT MONGODB
// =======================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err);
  });


// =======================
// LOAD COMMANDS (Recursive)
// =======================

const loadCommands = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);

    if (fs.lstatSync(filePath).isDirectory()) {
      loadCommands(filePath);
    } else if (file.endsWith(".js")) {
      const command = require(filePath);

      if (!command.data || !command.execute) {
        console.log(`⚠ Skipped invalid command file: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
      console.log(`📦 Loaded command: ${command.data.name}`);
    }
  }
};

loadCommands(path.join(__dirname, "commands"));


// =======================
// LOAD EVENTS
// =======================

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }

  console.log(`📡 Loaded event: ${file}`);
}


// =======================
// GLOBAL ERROR HANDLERS
// =======================

process.on("unhandledRejection", error => {
  console.error("❌ Unhandled Promise Rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("❌ Uncaught Exception:", error);
});


// =======================
// LOGIN
// =======================

client.login(process.env.BOT_TOKEN)
  .then(() => console.log("🚀 Bot is starting..."))
  .catch(err => console.error("❌ Bot Login Failed:", err));
