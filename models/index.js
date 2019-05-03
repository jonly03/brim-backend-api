const courtModel = require("./court");
const userModel = require("./User");
const checkinModel = require("./Checkin");

module.exports = {
  courts: courtModel,
  users: userModel,
  checkins: checkinModel
};
