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
    enum: [
      "waiting_payment",
      "account_check",
      "secured",
      "login_confirmed",
      "hold_24h",
      "completed",
      "cancelled"
    ],
    default: "waiting_payment"
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

