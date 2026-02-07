const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true
  },

  expiresAt: {
    type: Date,
    required: true
  },

  reminderSent: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
