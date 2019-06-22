const Mixpanel = require("mixpanel");
const courtHelpers = require("../models/court/details/helpers");

const mixpanel = Mixpanel.init(process.env.MIXED_PANEL_TOKEN, {
  protocol: "https"
});

const track = ({ event, payload }) => {
  return new Promise((resolve, reject) => {
    if (
      // List of all events
      !payload ||
      event == "FIRST_TIME_NON_REGISTERED_USER_VISIT" ||
      event == "NEW_USER_ACCOUNT_CREATED" ||
      event === "REGISTERED_USER_HOME_PAGE_VISIT" ||
      event === "REGISTERED_USER_REPEAT_VISIT" ||
      event === "PUSH_NOTIFICATION_TRIGGERED_VISIT" ||
      event === "COURT_VISIT" ||
      event === "CHECKIN" ||
      event === "CHECKOUT_BY_MOVING_AWAY_FROM_COURT" ||
      event === "NEW_CHATROOM_MESSAGE"
    ) {
      courtHelpers
        .getLocDetails(latLng)
        .then(loc => {
          if (loc && loc.city && loc.city.length) {
            payload.city = loc.city;
            payload.country = loc.country;

            delete payload.latLng; // Don't need to track this

            console.log("MixPanel Event: ", event);
            console.log("Payload to MixPanel: ", payload);
            mixpanel.track(event, payload);
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
