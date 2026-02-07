const mongoose = require("mongoose");

const mmProfileSchema = new mongoose.Schema({

  userId: {
    type: String,
    required: true,
    unique: true
  },

  name: {
    type: String,
    required: true
  },

  country: {
    type: String,
    default: "Not Set"
  },

  whatsapp: {
    type: String,
    default: "Not Set"
  },

  completedDeals: {
    type: Number,
    default: 0
  }

});

module.exports = mongoose.model("MMProfile", mmProfileSchema);
