const mmList = require("../config/mmList");

function isOwner(userId) {
  return userId === process.env.OWNER_ID;
}

function isMM(userId) {
  return Object.values(mmList).some(mm => mm.id === userId);
}

module.exports = {
  isOwner,
  isMM
};
