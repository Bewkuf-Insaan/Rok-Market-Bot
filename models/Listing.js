const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({

  listingId: {
    type: Number,
    required: true,
    unique: true
  },

  guildId: {
    type: String,
    required: true
  },

  sellerId: {
    type: String,
    required: true
  },

  mmName: {
    type: String,
    required: true
  },

  mmFee: {
    type: Number,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["available", "in_deal", "sold", "expired"],
    default: "available"
  },

  data: {
    type: Object,
    default: {}
  },

  screenshots: {
    type: [String],
    default: []
  },

  messageId: {
    type: String,
    default: null
  },

  channelId: {
    type: String,
    default: null
  },

  // ✅ ADD THIS
  expiresAt: {
    type: Date,
    default: function () {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Listing", listingSchema);
