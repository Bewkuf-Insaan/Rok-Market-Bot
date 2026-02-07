const Listing = require("../models/Listing");

async function getListingsForBudget(guildId, budget) {
  return await Listing.find({
    guildId,
    price: { $lte: budget },
    status: "available"
  }).limit(5);
}

async function validateInterest(listingId) {
  const listing = await Listing.findOne({ listingId });

  if (!listing) return { valid: false, reason: "Listing not found." };
  if (listing.status !== "available")
    return { valid: false, reason: "Listing not available." };

  return { valid: true, listing };
}

module.exports = {
  getListingsForBudget,
  validateInterest
};
