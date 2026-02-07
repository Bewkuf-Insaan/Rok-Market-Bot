const Counter = require("../models/Counter");

async function getNextDealId() {
  const counter = await Counter.findOneAndUpdate(
    { name: "dealId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
}

module.exports = getNextDealId;
