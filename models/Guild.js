const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },

  // Tickets
  ticketCategoryId: { type: String, default: null },

  // ACCOUNT
  priceChannels: { type: Object, default: {} },
  soldChannels: { type: Object, default: {} },

  // RESOURCES
  resourceSellChannelId: { type: String, default: null },
  resourceSoldChannelId: { type: String, default: null },

  // KINGDOM
  kingdomSellChannelId: { type: String, default: null },
  kingdomSoldChannelId: { type: String, default: null },

  logChannelId: { type: String, default: null },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Guild", guildSchema);
