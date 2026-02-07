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

  priceChannels: {
    type: Object,
    default: {}
  },

  soldChannels: {
    type: Object,
    default: {}
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
