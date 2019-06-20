const express = require("express");
const aws = require("aws-sdk");
let expo = new Expo();

const helpers = require("./helpers");
const courtHelpers = require("../../models/court/details/helpers");
const courtPhotosHelpers = require("../../models/court/photos");
// const db = require('../../models/Firestore').firestore;
const Users = require("../../models").users;
const Checkins = require("../../models").checkins;

const Router = express.Router();

// Router.get('/courts/unsplash', (req, res) =>{
//     Helpers.getUnsplashPhotos().then(unsplashPhotos =>{

//         res.status(200).json(unsplashPhotos)
//         CourtsDB.saveUnsplashPhotos(unsplashPhotos)
//         .then(res => {
//             // console.log(res.length);
//             // console.log(res);
//         })
//         .catch(err => {
//             res.status(500).json(err);
//         })
//     })
// })

// Router.get('/courts/city/:city', function(req, res){
//     Helpers.getCourts('city', req.params.city).then(courts => {
//         res.status(200).json(courts);

//         CourtsDB.save(courts).then(res => {
//             // console.log(res.length);
//             // console.log(res);
//         })
//     }).catch(err => {
//         res.status(500).json(err);
//     })
// })

// Courts routes
Router.get("/courts/latLng/:lat/:lng", function(req, res) {
  let { lat, lng } = req.params;

  if (!lat || !lng) {
    return res.status(500).json({ error: "lat and lng are required" });
  }

  // Only get courts from our DB
  courtHelpers
    .getNearbyCourts({ lat: Number(lat), lng: Number(lng) })
    .then(courtsRes => {
      console.log("Done getting nearby courts.");
      console.log("Getting court photos...");
      // courtsRes = {dist: courts:[]}

      // No need since courts now have photos
      // TODO: Clean up
      // let getCourtPhotos = courtsRes.docs.map(court => {
      //   return courtPhotosHelpers.real.getCourtPhotos(court._id);
      // });

      // Get placeholder photos to pic random photos from for courts with no uploaded pictures
      //let getCourtPlaceholderPhotos = courtPhotosHelpers.placeholder.getPlaceholderPhotos();

      // try {
      //   Promise.all([
      //     // ...getCourtPhotos,
      //     getCourtPlaceholderPhotos
      //   ])
      //     .then(results => {
      //       console.log("Done getting court photos and placeholder photos.");
      //       console.log("Packaging it all up...");

      //       let placeholderPhotos = results[results.length - 1];
      // let photos = results.slice(0, results.length - 1);

      // Add court photos when we have some and add placeholders for courts with no photos
      // We have a 1:1 courts to photos array
      // So same idx in courts maps to the same idx in photos
      courtsRes.docs.forEach((court, idx) => {
        if (court.photos.length <= 0) {
          //   court.photos = photos[idx];
          // } else {
          // court.photos = [helpers.getRandomItem(placeholderPhotos)];
          court.photos = [
            "https://brimbasketballcourtsimages.s3.amazonaws.com/court_placeholder.JPG"
          ];
        }
      });

      console.log("Done packaging it all up");
      res.status(200).json(courtsRes);
      // })
      // .catch(err => {
      //   console.log(err);
      //   res.status(500).json(err);
      // });
      // } catch (err) {
      //   console.log(err);
      //   res.status(500).json(err);
      // }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json(err);
    });
});

Router.get("/courts/:id", (req, res) => {
  if (!req.params.id) {
    return res.status(500).json({ error: "id is required" });
  }
  courtHelpers
    .getOneCourt(req.params.id)
    .then(courts => {
      // No need since courts now have photos
      // TODO: Clean up
      // courtPhotosHelpers.real
      //   .getCourtPhotos(courts[0]._id)
      //   .then(photos => {
      //     courts[0].photos = photos.length ? photos : [];
      res.json(courts[0]);
      // })
      // .catch(err => {
      //   console.log(err);
      //   res.status(500).json(err);
      // });
    })
    .catch(err => {
      console.log(err);
      res.status(404).json({ err });
    });
});

// Checkins routes
Router.get("/checkins/:court_id/:requestor/:clientId", (req, res) => {
  if (!req.params.court_id || !req.params.requestor || !req.params.clientId) {
    res
      .status(500)
      .json({ error: "court_id, requestor, and clientId are required" });
  }

  const { court_id, requestor, clientId } = req.params;

  Checkins.getCheckedInUsers({ court_id, requestor, clientId })
    .then(checkedInUsers => res.json({ checkedInUsers }))
    .catch(error => {
      console.log("Failed to get checked in users");
      res.status(404).status({ error });
    });
});

// Users routes
Router.post("/users/email", (req, res) => {
  console.log("Hit email creation route");
  if (!req.body || !req.body.email) {
    return res.status(500).json({ error: "No body on request or no email" });
  }

  const { email } = req.body;
  console.log("email: ", email);
  Users.createWithEmail({ email })
    .then(email => res.status(200).json(email))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/username", (req, res) => {
  if (!req.body) {
    return res.statust(500).json({
      error: "Oops something doesn't look right. No body on the request"
    });
  }
  const { email, username } = req.body;

  if (!email || !username) {
    return res.json({
      error: "email and username are required payloads"
    });
  }

  Users.updateUsername({ email, username })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.get("/users/takenUsernames", (req, res) => {
  Users.getTakenUsernames()
    .then(takenUsernames => res.status(200).json(takenUsernames))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/token", (req, res) => {
  if (!req.body) {
    return res.statust(500).json({
      error: "Oops something doesn't look right. No body on the request"
    });
  }
  const { email, token } = req.body;

  if (!email || !token) {
    return res.json({
      error: "email and token are required payloads"
    });
  }

  Users.updateToken({ email, token })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/location", (req, res) => {
  const { email, location } = req.body;

  if (!email || !location || !location.lat || !location.lng) {
    return res.json({
      error: "email, token, lat, and lng are required payloads"
    });
  }

  let { lat, lng } = location;
  lat = Number(lat);
  lng = Number(lng);

  Users.updateLocation({ email, lat, lng })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/background_location", (req, res) => {
  console.log("Updating user's location from the background");
  const { email, location } = req.body;

  if (!email || !location || !location.lat || !location.lng) {
    return res.json({
      error: "email, token, lat, and lng are required payloads"
    });
  }

  let { lat, lng } = location;
  lat = Number(lat);
  lng = Number(lng);

  Users.updateLocation({ email, lat, lng })
    .then(success => {
      console.log("Successfully updated user's location from the background");
    })
    .catch(error => {
      console.log("Failed to update user's location from the background");
    });

  // Get courts near this new location to check if user is a court
  // If at a court, send them a push notification to check in
  courtHelpers
    .getNearbyCourts({ lat, lng })
    .then(courtsRes => {
      console.log(
        "Done getting nearby courts from background location update."
      );

      // We only expect the user to only at one court
      const [courtToCheckin] = courtsRes.docs.filter(court => court.dist === 0);

      if (!courtToCheckin) {
        return;
      }

      Users.getToken({ email })
        .then(({ token }) => {
          if (!token || !Expo.isExpoPushToken(token)) {
            return;
          }

          // Create notification
          let notifications = [];
          let title = `You are at ${courtToCheckin.name}. Here to 🏀?`;
          let body = "Check in to alert other players to join you";
          notifications.push({
            title,
            to: token,
            sound: "default",
            body,
            data: {
              courtId: courtToCheckin._id,
              type: "background_location_checkin"
            }
          });

          // Send notification
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
            "Failed to get token from background location update with error: ",
            error
          );
        });
    })
    .catch(err => {
      console.log(
        "Failed to get nearby courts from background location with error: ",
        err
      );
      res.status(500).json(err);
    });
});

Router.get("/users/courts/interest/:email", (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.json({
      error: "email is a required payload"
    });
  }

  Users.getCourtsOfInterest({ email })
    .then(courtsOfInterest => res.status(200).json(courtsOfInterest))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/courts/interest", (req, res) => {
  const { email, courtId } = req.body;

  if (!email || !courtId) {
    return res.json({
      error: "email and courtId are required payloads"
    });
  }

  console.log(
    `Adding court: ${courtId} on user: @${email} list of courts they are interested in`
  );

  Users.addToCourtsOfInterest({ email, courtId })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.delete("/users/courts/interest", (req, res) => {
  console.log("In DELETE route /user/courts/interest");
  const { email, courtId } = req.body;
  console.log(`email: ${email} courtId: ${courtId}`);

  if (!email || !courtId) {
    return res.json({
      error: "email and courtId are required payloads"
    });
  }

  console.log(
    `Removing court: ${courtId} from user: @${email} list of courts of interest`
  );

  Users.removeFromCourtsOfInterest({ email, courtId })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

// TODO: move this functionality in the socket
Router.get("/users/near/:lat/:lng", (req, res) => {
  let { lat, lng } = req.params;

  if (!lat || !lng) {
    return res.json({
      error: "lat and lng are required query parameters"
    });
  }

  lat = Number(lat);
  lng = Number(lng);

  Users.getUsersNearAPoint({ latLng: { lat, lng } })
    .then(users => res.status(200).json(users))
    .catch(error => res.status(404).json(error));
});

Router.delete("/users/token/:email", (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.json({
      error: "email is a required request parameter"
    });
  }

  Users.removeToken({ email })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

// ballUp+ API Routes
Router.get("/plus/courtsByCity", (req, res) => {
  // Gets all courts with their photos
  courtHelpers
    .getAllCourts()
    .then(courtsRes => {
      // No need since courts now have photos
      // TODO: Clean up
      // let getCourtPhotos = courtsRes.map(court => {
      //   return courtPhotosHelpers.real.getCourtPhotos(court._id);
      // });

      // try {
      //   Promise.all(getCourtPhotos)
      //     .then(photos => {
      let courts = {};
      courts.total = courtsRes.length;
      courts.photoCount = 0;

      courtsRes.forEach((court, idx) => {
        if (court.photos.length) {
          // court.photos = photos[idx];
          courts.photoCount += court.photos.length;
        }
        // else {
        //   court.photos = [];
        // }
      });

      // Package them by city
      let courtsByCityObj = {};
      courtsRes.map(court => {
        if (!courtsByCityObj[court.city]) {
          courtsByCityObj[court.city] = [court];
        } else {
          courtsByCityObj[court.city].push(court);
        }
      });
      courts.cityCount = Object.keys(courtsByCityObj).length;

      let courtsByCityArr = [];
      for (const city in courtsByCityObj) {
        courtsByCityArr.push({ [city]: courtsByCityObj[city] });
      }

      let courtsBycountryCountObj = {};
      courtsRes.map(court => {
        if (!courtsBycountryCountObj[court.country]) {
          courtsBycountryCountObj[court.country] = 0;
        } else {
          courtsBycountryCountObj[court.country]++;
        }
      });
      courts.countryCount = Object.keys(courtsBycountryCountObj).length;
      courts.courtsByCity = courtsByCityArr;

      return res.status(200).json(courts);
      // })
      // .catch(err => {
      //   console.log(err);
      //   res.status(500).json(err);
      // });
    })
    // .catch (err) {
    //   console.log(err);
    //   res.status(500).json(err);
    // }
    .catch(err => {
      console.log("Failed to get all courts");
      return res.send({});
    });
});

Router.get("/plus/courtsById", (req, res) => {
  // Gets all courts with their photos
  courtHelpers
    .getAllCourts()
    .then(courtsRes => {
      // No need since courts now have photos
      // TODO: Clean up
      // let getCourtPhotos = courtsRes.map(court => {
      //   return courtPhotosHelpers.real.getCourtPhotos(court._id);
      // });

      // try {
      //   Promise.all(getCourtPhotos)
      //     .then(photos => {
      let courts = {};
      courtsRes.forEach((court, idx) => {
        if (court.photos.length) {
          // court.photos = photos[idx];
          courts.photoCount += court.photos.length;
        }
        // else {
        //   court.photos = [];
        // }
      });

      // Package them by id
      let courtsByIdObj = {};
      courtsRes.map(court => (courtsByIdObj[court._id] = [court]));

      courts.courtsById = courtsByIdObj;

      return res.status(200).json(courts);
    })
    // .catch(err => {
    //   console.log(err);
    //   res.status(500).json(err);
    // });
    // } catch (err) {
    //   console.log(err);
    //   res.status(500).json(err);
    // }
    .catch(err => {
      console.log("Failed to get all courts");
      return res.send({});
    });
});

Router.post("/plus/uploadCourtPhoto", (req, res) => {
  const { fileUrl, fileType, fileName, courtId } = req.body;

  if (
    !fileUrl ||
    !fileType ||
    fileType.includes("image/") === false ||
    !fileName ||
    !courtId
  ) {
    return res.status(500).json({
      error:
        "fileUrl, fileType, fileName and courtId are required in the body. Only image fileTypes are allowed"
    });
  }

  const buf = Buffer.from(
    fileUrl.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const s3 = new aws.S3();
  const S3_BUCKET = process.env.S3_BUCKET;
  aws.config.region = "us-east-1";
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: buf,
    Expires: 60,
    ContentType: fileType,
    ACL: "public-read"
  };

  s3.upload(s3Params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(404).json({ error: "Failed to " });
    }

    const photoUrl = data.Location;
    console.log(photoUrl);

    courtHelpers
      .addCourtPhoto({ courtId, photoUrl })
      .then(court => res.json({ court }))
      .catch(error => res.json({ error }));
  });
});

Router.post("/plus/s3PhotoUrl", (req, res) => {
  const { fileUrl, fileType, fileName } = req.body;
  console.log(fileUrl);
  console.log(fileType);
  console.log(fileName);
  if (
    !fileUrl ||
    !fileType ||
    fileType.includes("image/") === false ||
    !fileName
  ) {
    return res.status(500).json({
      error:
        "fileUrl, fileType, and fileName are required in the body. Only image fileTypes are allowed"
    });
  }

  const buf = Buffer.from(
    fileUrl.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const s3 = new aws.S3();
  const S3_BUCKET = process.env.S3_BUCKET;
  aws.config.region = "us-east-1";
  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: buf,
    Expires: 60,
    ContentType: fileType,
    ACL: "public-read"
  };

  s3.upload(s3Params, (err, data) => {
    if (err) {
      console.log(err);
      return res.status(404).json({ error: "Failed to " });
    }

    const url = data.Location;
    console.log(url);

    return res.json({ url });
  });
});

Router.post("/plus/courts", (req, res) => {
  if (!req.body.court) {
    return res.status(500).json({ error: "court is required on the body" });
  }

  const { court } = req.body;

  if (
    !court._id ||
    !court.name ||
    !court.address ||
    !court.lat ||
    !court.lng ||
    !court.city ||
    !court.country ||
    !court.photos
  ) {
    return res.status(500).json({
      error:
        "court has to have _id, name, address, lat, lng, city, country, and photos"
    });
  }

  courtHelpers
    .addNewCourt({ court })
    .then(() => res.json({ success: "Successfully created new court" }))
    .catch(error => res.status(404).json({ error }));
});

Router.post("/plus/courts/:courtId", (req, res) => {
  if (!req.params || !req.params.courtId) {
    return res.status(500).json({ error: "courtId is required request param" });
  }

  if (!req.body || !req.body.updates) {
    return res.status(500).json({ error: "the body needs an updates object" });
  }

  const { courtId } = req.params;
  const { updates } = req.body;
  courtHelpers
    .updateCourt({ courtId, updates })
    .then(() => res.status(200).json({ success: "updated court" }))
    .catch(error => res.status(400).json({ error }));
});

Router.delete("/plus/courts/:courtId", (req, res) => {
  if (!req.params || !req.params.courtId) {
    return res.status(500).json({ error: "courtId is required request param" });
  }

  const { courtId } = req.params;
  courtHelpers
    .removeCourt({ courtId })
    .then(() => res.status(200).json({ success: "deleted court" }))
    .catch(error => res.status(400).json({ error }));
});

module.exports = Router;
