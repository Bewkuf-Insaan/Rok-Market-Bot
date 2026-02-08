const mongoose = require("mongoose");

const draftSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },

  guildId: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["seller", "buyer"],
    required: true
  },

  // SELLER ONLY
  sellType: {
    type: String,
    enum: ["account", "resources", "kingdom"],
    default: null
  },

  // BUYER ONLY (🔥 MISSING BEFORE)
  buyType: {
    type: String,
    enum: ["account", "resources", "kingdom"],
    default: null
  },

  step: {
    type: Number,
    required: true
  },

  data: {
    type: Object,
    default: {}
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Draft", draftSchema);
