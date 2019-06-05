require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const courtHelpers = require("./models/court/details/helpers");
const Users = require("./models").users;
const { Expo } = require("expo-server-sdk");
const http = require("http");
var Mixpanel = require("mixpanel");

// Create a new Expo SDK client
let expo = new Expo();

var mixpanel = Mixpanel.init(process.env.MIXED_PANEL_TOKEN, {
  protocol: "https"
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json({ limit: "500000000000000000mb" }));
app.use(
  bodyParser.urlencoded({ limit: "500000000000000000mb", extended: true })
);

// Enable CORS
// TODO only allow requests from hoopsgram.com
app.use(function(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    var allowedOrigins = [
      "https://iballup.herokuapp.com",
      "http://iballup.herokuapp.com",
      "https://ballupplus.herokuapp.com",
      "http://ballupplus.herokuapp.com"
      // "https://kocupid.herokuapp.com",
      // "http://kocupid.herokuapp.com"
    ];
    var origin = req.headers.origin;

    if (allowedOrigins.indexOf(origin) > -1) {
      res.header("Access-Control-Allow-Origin", origin);
    }

    // Wide open for anyone just in testing. Remember to close it off
    // res.header("Access-Control-Allow-Origin", "*");
  } else {
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

// parse application/json
app.use(express.json());

const seedRoutes = require("./controllers/seeds");
const apiRoutes = require("./controllers/api");

app.get("/", (req, res) => {
  res.send("Hello");
});

app.get("/location/:lat/:lng", (req, res) => {
  if (
    !req.params ||
    !req.params.lat ||
    !req.params.lng ||
    !Number(req.params.lat) ||
    !Number(req.params.lng)
  ) {
    return res.status(400).send();
  }

  const { lat, lng } = req.params;
  courtHelpers
    .getLocDetails({ lat: Number(lat), lng: Number(lng) })
    .then(details => {
      if (details) return res.json(details);
    })
    .catch(err => res.json(err));
});

app.use("/seed", seedRoutes);

app.use("/api", apiRoutes);

app.post("/checkin/:courtId", (req, res) => {
  // Route to for  checkins
  // No need for user to be logged in
  // Just get court's lat, lng and increase their checkins_current & checkins_total
  // if (!req.params.courtId){
  //     console.log("Bad request");
  //     return res.status(500).json("Bad request: expected a correct court id");
  // }

  // courtHelpers.checkin(req.params.courtId)
  // .then((checkins) =>{
  //     // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
  //     if (client){

  //       // Notify listening clients with checkins count updates
  //       socket.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
  //       socket.broadcast.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
  //     }
  //     return res.status(200).send();
  // })
  // .catch((err) => res.status(500).send() )
  res.json({ msg: "This route does nothing" }); // Moved check in code into socket.io
});

app.post("/checkout/:courtId", (req, res) => {
  // Route to for  checkouts
  // No need for user to be logged in
  // Just get court's lat, lng and decrease their checkins_current & checkins_total
  // if (!req.params.courtId){
  //     console.log("Bad request");
  //     return res.status(500).json("Bad request: expected a correct court id");
  // }

  // courtHelpers.checkout(req.params.courtId)
  // .then((checkins) =>{
  //     // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
  //     if (client){

  //       // Notify listening clients with checkins count updates
  //       socket.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
  //       socket.broadcast.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
  //     }

  //     return res.status(200).send();
  // })
  // .catch(() => res.status(500).send());
  res.json({ msg: "This route does nothing" }); // Moved check out code into socket.io
});

app.post("/track/:event", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    // non_supported_cities,successful_visits,went_to_court,checked_in, chatroom_msg
    console.log("Tracking...");

    const { event } = req.params;
    if (!req.body || !req.body.lat || !req.body.lng)
      return res.status(400).send();

    if (
      event === "non_supported_cities" ||
      event === "successful_visits" ||
      event === "went_to_court" ||
      event === "checked_in" ||
      "chatroom_msg"
    ) {
      courtHelpers
        .getLocDetails(req.body)
        .then(loc => {
          if (loc && loc.city && loc.city.length) {
            console.log(`Event: ${event}`);
            console.log(`City: ${loc.city}`);
            console.log(`Country: ${loc.country}`);
            mixpanel.track(event, { city: loc.city, country: loc.country });
          }
          res.send();
        })
        .catch(err => res.send());
    } else {
      res.send();
    }
  } else {
    console.log("In testing environment. No need to send data to mixpanel");
    res.send();
  }
});

let server = app.listen(PORT, () => {
  console.log(`hoopsgram api server listening on: ${PORT}`);

  setInterval(function() {
    http.get("http://ballup-turned-hoopsgram-api.herokuapp.com");
  }, 5 * 60 * 1000); // every 5 minutes wake it up
});

notifyUsersNearACourt = ({ type, info }) => {
  // Only notify users near the court who have granted us permission to send them push notifications
  const { courtLocation: latLng, courtId, sender, courtName } = info;

  Users.getUsersNearAPoint({ latLng })
    .then(data => {
      const { docs: users } = data;

      if (users.length <= 0) {
        // No need to notify anyone since no one near this court has opted in to receive push notifications
        return;
      }

      console.log(
        `Found ${users.length} users near {lat: ${latLng.lat}, lng: ${
          latLng.lng
        }`
      );
      console.log(
        "Filtering out users with invalid push tokens and the user who initiated the notification (if a username exists)..."
      );
      // Filter out users with invalid push tokens and the user who sent the message
      let potentialUsersToNotify = users.filter(user => {
        const { username, token: pushToken } = user;

        if (sender) {
          // When it's a chatroom message the sender is always a valid username
          // Anyone can check in without a username, so take care of that
          return username !== sender && Expo.isExpoPushToken(pushToken);
        }

        return Expo.isExpoPushToken(pushToken);
      });

      console.log(
        "Done filtering out users with invalid push tokens and the user who initiated the notification (if a username exists)"
      );
      console.log(
        "Getting courts of no interest for our potential users to notify..."
      );
      const getPotentialUsersToNotifyCourtsOfNoInterest = potentialUsersToNotify.map(
        user =>
          Users.getCourtsOfNoInterest({
            username: user.username
          })
      );

      // Finally weed out users who specified that they don't want to be notified about the court in which the message came from
      let allUsersToNotify = [];
      Promise.all(getPotentialUsersToNotifyCourtsOfNoInterest)
        .then(allPotentialUsersToNotifyCourtsOfNoInterest => {
          console.log(
            "Done getting courts of no interest for our potential users to notify"
          );
          console.log(
            "Weeding out users who specified that they don't want to be notified about the court in which the message came from..."
          );
          allUsersToNotify = allPotentialUsersToNotifyCourtsOfNoInterest.map(
            (potentialUserToNotifyCourtsOfNoInterest, idx) => {
              const { courtIds } = potentialUserToNotifyCourtsOfNoInterest;
              if (courtIds.indexOf(courtId) === -1) {
                return potentialUsersToNotify[idx];
              }
            }
          );
          console.log(
            "Done weeding out users who specified that they don't want to be notified about the court in which the message came from"
          );

          // Create notifications
          let notifications = [];
          for (let idx = 0; idx < allUsersToNotify.length; idx++) {
            const userToNotify = allUsersToNotify[idx];
            console.log("User to notify");
            console.log(userToNotify);
            const { token: pushToken, dist } = userToNotify;

            let title = "";
            let body = "";
            if (type === "new_chatroom_msg") {
              title = `New BRIM Message Alert at a court ${dist}mi near you!`;

              body = `@${sender} in ${courtName} chat room:\n${info.text}`;
            } else if (type === "checkedin") {
              title = `New BRIM Checkin Alert at a court ${dist}mi near you!`;

              const {
                checkins: { current }
              } = info;
              body = `${current} other ${
                current > 1 ? "people are" : "person is"
              } currently playing at ${courtName}`;
            }
            notifications.push({
              title,
              to: pushToken,
              sound: "default",
              body,
              data: { courtId, sender, courtName }
            });
          }

          // Batch send notifications
          // The Expo push notification service accepts batches of notifications so
          // that you don't need to send 1000 requests to send 1000 notifications. We
          // recommend you batch your notifications to reduce the number of requests
          // and to compress them (notifications with similar content will get
          // compressed).
          console.log("Batching notifications");
          console.log(notifications);
          let chunks = expo.chunkPushNotifications(notifications);
          let tickets = [];
          (async () => {
            // Send the chunks to the Expo push notification service. There are
            // different strategies you could use. A simple one is to send one chunk at a
            // time, which nicely spreads the load out over time:
            for (let chunk of chunks) {
              try {
                let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                console.log(ticketChunk);
                tickets.push(...ticketChunk);
                // NOTE: If a ticket contains an error code in ticket.details.error, you
                // must handle it appropriately. The error codes are listed in the Expo
                // documentation:
                // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
              } catch (error) {
                console.error(error);
              }
            }
          })();
        })
        .catch(error => {
          console.log(
            "Failed to send push notification because getCourtsOfNoInterest failed"
          );
          console.log(error);
        });
    })
    .catch(error => {
      console.log(
        `Failed to retrieve users near courtId: ${
          message.courtId
        } located at {lat: ${message.courtLocation.lat}, lng: ${
          message.courtLocation.lng
        }}`
      );
      console.log(error);
    });
};

//SOCKET IO
let io = require("socket.io").listen(server);

io.on("connection", socket => {
  console.log("clientID/" + socket.id + " connected");

  // When we get an 'online' msg with client coords, notify nearbycourts to increment their nearby online count
  socket.on("online", coords => {
    console.log("clientId/" + socket.id + " just came online");

    courtHelpers.isClientOnline(socket.id).then(clientOnline => {
      if (clientOnline) {
        console.log(
          `ClientId/${
            socket.id
          } is already online. No need to update anything right now. Just chilling...`
        );
      } else {
        console.log(`ClientId/${socket.id} wasn't already online.`);

        // Request connected clients usernames to let this client know which username are already taken
        socket.broadcast.emit("get-username");

        courtHelpers
          .incrementCourtsNearbyOnlineCounts(socket.id, coords)
          .then(courtIds => {
            // If not courts were found near the client, no need to broadcast anything
            if (courtIds.length) {
              console.log(
                "Broadcasting presence of clientId/" +
                  socket.id +
                  " to courts near them"
              );
              socket.broadcast.emit("increment_nearby_online_count", courtIds);
            }
          });
      }
    });
  });

  // When connected, keep an ear out for checkin messages and save the connected client
  socket.on("checkin", data => {
    const { courtId, sender: username, checkInTime } = data;

    console.log(
      "checkin message from clientId/" +
        socket.id +
        " received for courtId/" +
        courtId
    );
    console.log("checking client in...");
    courtHelpers
      .checkin({ clientId: socket.id, courtId, username, checkInTime })
      .then(checkins => {
        console.log(
          "Done checking clientId/" + socket.id + " into courtId/" + courtId
        );
        console.log("checkedin message sent from server to client");
        socket.emit("checkedin", { courtId, checkins });
        socket.broadcast.emit("checkedin", { courtId, checkins });

        // Send push notifiication to nearby users who are interested in knowing about activities around this court
        notifyUsersNearACourt({
          type: "checkedin",
          info: { ...data, checkins }
        });
      })
      .catch(err => {
        console.log("Failed to check user in");
        console.log(err);
        socket.emit("checkin-failed", { error: "Failed to check user in" });
      });
  });

  // Keep an ear out for when clients disconnect so we can check them out
  socket.on("checkout", data => {
    const { courtId, sender: username } = data;

    // Check clients out when we receive the checkout message
    console.log(
      "checkout message from clientId/" +
        socket.id +
        " received for courtId/" +
        courtId
    );
    console.log("checking client out...");
    courtHelpers
      .checkout({ clientId: socket.id, courtId, username })
      .then(checkins => {
        console.log(
          "Done checking clientId/" + socket.id + " out of courtId/" + courtId
        );
        console.log("checkedout message sent from server to client");
        socket.emit("checkedout", { courtId, checkins });
        socket.broadcast.emit("checkedout", { courtId, checkins });
      })
      .catch(err => {
        console.log("Failed to check user out");
        console.log(err);
        // socket.emit('checkout-failed', {error: 'Failed to check user out'})
      });
  });

  // Keep an ear out for when clients send chat room messages and broadcast them to other clients in the same room
  socket.on("chatroom_msg", message => {
    console.log(
      `Received message from @${message.sender} in chatroom of courtId: ${
        message.courtId
      } located at {lat: ${message.courtLocation.lat}, lng: ${
        message.courtLocation.lng
      }}`
    );
    socket.broadcast.emit("new_chatroom_msg", message);

    // Send push notifiication to nearby users who are interested in knowing about activities around this court
    notifyUsersNearACourt({ type: "new_chatroom_msg", info: { ...message } });
  });

  // Keep an ear out for when clients send us their usernames on a new chatroom message
  socket.on("chatroom_msg_with_nearby_username", message => {});

  // Keep an ear out for when clients are typing
  socket.on("someone_is_typing", courtInfo => {
    socket.broadcast.emit("others_typing", courtInfo);
  });

  // Keep an ear out for when clients stopped typing
  socket.on("someone_stopped_typing", courtInfo => {
    socket.broadcast.emit("others_stopped_typing", courtInfo);
  });

  // Keep an ear out for clients who want to get a history of a chatroom messages history
  socket.on("get_chatroom_messages_for_court", ({ courtId }) => {
    socket.broadcast.emit("send_chatroom_messages", { courtId });
  });

  // Keep an ear out for clients sending their chatroom messages history
  socket.on("chatroom_messages", history => {
    socket.broadcast.emit("chatroom_messages_history", history);
  });

  socket.on("remove_username_on_checkout", data => {
    const { username } = data;
    console.log(
      `App closed and ${username} was checked into a court. Checking them out`
    );
    courtHelpers
      .removeUsernameOnCheckout({ username })
      .then(() => {})
      .catch(err => {
        console.log(`Failed to remove ${username} from checkins`);
        console.log(err);
      });
  });

  // Check clients out when they go offline and notify courts near them to decrement they nearby online counts
  socket.on("disconnect", () => {
    console.log(`clientId/${socket.id} disconnected.`);
    courtHelpers
      .checkoutOnDisconnect({ clientId: socket.id })
      .then(courtInfo => {
        if (courtInfo !== null && courtInfo) {
          const { courtId, checkins } = courtInfo;
          // Don't worry about emitting the message back to the sender because they are disconnected
          // Just broadcast the message to every other clients still online
          if (courtId && checkins) {
            console.log("Broadcasting disconnected client checkout message");
            socket.broadcast.emit("checkedout", { courtId, checkins });
          } else {
            console.log("Client was not checked in");
          }
        }
      })
      .catch(err => {
        console.log("Failed to check user out");
        console.log(err);
        // socket.emit('checkout-failed', {error: 'Failed to check user out'})
      });

    courtHelpers.decrementCourtsNearbyOnlineCounts(socket.id).then(courtIds => {
      // If not courts were found near the client, no need to broadcast anything
      if (courtIds.length) {
        console.log(
          "Broadcasting offline status of clientId/" +
            socket.id +
            " to courts near them"
        );
        socket.broadcast.emit("decrement_nearby_online_count", courtIds);
      }
    });
  });

  // Keep an ear out for when new clients want to know taken usernames
  socket.on("get_taken_usernames", () => {
    console.log("New user about to pick a username...");
    console.log(
      "Sending message to all clients with usernames to tell us what they are..."
    );
    socket.broadcast.emit("get_taken_username");
  });

  // Broadcast to other clients the taken username
  socket.on("taken_username", username => {
    console.log("Connected clients sending us their taken usernames");
    console.log(username, " username is taken");
    socket.broadcast.emit("taken_usernames", username);
  });
});
