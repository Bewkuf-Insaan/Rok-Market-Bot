const Counter = require("../models/Counter");

async function getNextListingId() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { name: "listingId" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    return counter.value;
  } catch (error) {
    console.error("Error generating listing ID:", error);
    throw error;
  }
}

module.exports = getNextListingId;