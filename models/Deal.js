const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema({
  listingId: {
    type: Number,
    required: true
  },

  guildId: {
    type: String,
    required: true
  },

  buyerId: {
    type: String,
    required: true
  },

  sellerId: {
    type: String,
    required: true
  },

  mmId: {
    type: String,
    required: true
  },

  status: {
  type: String,
  enum: ["active", "completed", "cancelled"],
  default: "active"
},

  holdUntil: {
    type: Date,
    default: null
  },

  checklistMessageId: {
  type: String,
  default: null
  },

  channelId: {
    type: String,
    default: null
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Deal", dealSchema);


