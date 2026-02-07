const Draft = require("../models/Draft");

async function startSellerDraft(userId, guildId) {
  return await Draft.findOneAndUpdate(
    { userId },
    {
      userId,
      guildId,
      role: "seller",
      step: 1,
      data: {}
    },
    { upsert: true }
  );
}

async function getDraft(userId) {
  return await Draft.findOne({ userId });
}

async function updateDraft(userId, step, data) {
  return await Draft.findOneAndUpdate(
    { userId },
    { step, data, updatedAt: new Date() },
    { new: true }
  );
}

async function deleteDraft(userId) {
  return await Draft.deleteOne({ userId });
}

module.exports = {
  startSellerDraft,
  getDraft,
  updateDraft,
  deleteDraft
};
