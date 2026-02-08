const mongoose = require("mongoose");

const guildSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },

  ticketCategoryId: {
    type: String,
    default: null
  },

  showcaseCategoryId: {
    type: String,
    default: null
  },

  // 🧑‍💼 ACCOUNT
  priceChannels: {
    type: Object,
    default: {}
  },

  soldChannels: {
    type: Object,
    default: {}
  },

  // 🌾 RESOURCES
  resourceSellChannelId: {
    type: String,
    default: null
  },

  // 🏰 KINGDOM
  kingdomSellChannelId: {
    type: String,
    default: null
  },

  logChannelId: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Guild", guildSchema);
