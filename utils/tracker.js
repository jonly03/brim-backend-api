const Mixpanel = require("mixpanel");
const courtHelpers = require("../models/court/details/helpers");
const { saveCourtVisit } = require("../models/Analytics");

const mixpanel = Mixpanel.init(process.env.MIXED_PANEL_TOKEN, {
  protocol: "https"
});

const track = ({ event, payload }) => {
  return new Promise((resolve, reject) => {
    const { latLng } = payload;
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
      event === "NEW_CHATROOM_MESSAGE" ||
      event === "USER_SHARED_APP" ||
      event === "USER_VISITED_SHOP"
    ) {
      courtHelpers
        .getLocDetails(latLng)
        .then(loc => {
          if (loc && loc.city && loc.city.length) {
            payload.city = loc.city;
            payload.country = loc.country;

            const { latLng } = payload;

            // Don't need to track this on Mixpanel side
            delete payload.latLng;

            if (event === "COURT_VISIT") {
              // Don't need to track this on the Analytics (Data Science) side

              const courtVisit = { ...payload, ...latLng };
              delete courtVisit.email;
              delete courtVisit.city;
              delete courtVisit.country;
              delete courtVisit.platform;

              saveCourtVisit({ courtVisit })
                .then(success => {
                  console.log("Successfully saved courtVisit record");
                })
                .catch(error => {
                  console.log(error);
                });
            }

            // Don't need to track this on Mixpanel side
            delete payload.timestamp;
            delete payload.checkinsCurrentCount;
            delete payload.courtId;

            console.log("Sending Tracking Event to MixPanel: ", {
              event,
              payload
            });
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
