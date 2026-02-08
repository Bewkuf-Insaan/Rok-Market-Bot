const Listing = require("../models/Listing");

async function getListingsForBudget(guildId, budget) {
  const minPrice = Math.max(0, budget - 100);
  const maxPrice = budget + 100;

  const listings = await Listing.find({
    guildId,
    sellType: "account",          // ✅ only accounts
    status: "available",
    price: { $gte: minPrice, $lte: maxPrice }
  })
    .limit(10); // fetch more, we'll sort then trim

  // 🔢 Sort by closest price to buyer budget
  listings.sort(
    (a, b) => Math.abs(a.price - budget) - Math.abs(b.price - budget)
  );

  // 🔽 Return top 5 closest matches
  return listings.slice(0, 5);
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
