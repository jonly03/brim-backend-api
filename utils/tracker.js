const Mixpanel = require("mixpanel");
const courtHelpers = require("../models/court/details/helpers");

const mixpanel = Mixpanel.init(process.env.MIXED_PANEL_TOKEN, {
  protocol: "https"
});

const track = ({ event, payload }) => {
  return new Promise((resolve, reject) => {
    if (
      event === "visit" ||
      event === "successful_visits" ||
      event === "went_to_court" ||
      event === "checked_in" ||
      "chatroom_msg"
    ) {
      courtHelpers
        .getLocDetails(latLng)
        .then(loc => {
          if (loc && loc.city && loc.city.length) {
            console.log(`Event: ${event}`);
            console.log(`City: ${loc.city}`);
            console.log(`Country: ${loc.country}`);
            mixpanel.track(event, {
              ...payload,
              city: loc.city,
              country: loc.country
            });
          }
          return resolve();
        })
        .catch(err => {
          console.log("Failed to get location details with error: ", err);
          reject();
        });
    } else {
      console.log("unsupported tracking event: ", event);
      return resolve();
    }
  });
};

module.exports = {
  track
};
