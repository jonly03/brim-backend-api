const express = require("express");
const aws = require("aws-sdk");
const axios = require("axios");

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
      let getCourtPlaceholderPhotos = courtPhotosHelpers.placeholder.getPlaceholderPhotos();

      try {
        Promise.all([
          // ...getCourtPhotos,
          getCourtPlaceholderPhotos
        ])
          .then(results => {
            console.log("Done getting court photos and placeholder photos.");
            console.log("Packaging it all up...");

            let placeholderPhotos = results[results.length - 1];
            // let photos = results.slice(0, results.length - 1);

            // Add court photos when we have some and add placeholders for courts with no photos
            // We have a 1:1 courts to photos array
            // So same idx in courts maps to the same idx in photos
            courtsRes.docs.forEach((court, idx) => {
              if (court.photos.length <= 0) {
                //   court.photos = photos[idx];
                // } else {
                court.photos = [helpers.getRandomItem(placeholderPhotos)];
              }
            });

            console.log("Done packaging it all up");
            res.status(200).json(courtsRes);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json(err);
          });
      } catch (err) {
        console.log(err);
        res.status(500).json(err);
      }
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
Router.get("/checkins/:court_id/:requestor", (req, res) => {
  if (!req.params.court_id || !req.params.requestor) {
    res.status(500).json({ error: "court_id and requestor are required" });
  }

  const { court_id, requestor } = req.params;

  Checkins.getCheckedInUsers({ court_id, requestor })
    .then(checkedInUsers => res.json({ checkedInUsers }))
    .catch(error => {
      console.log("Failed to get checked in users");
      res.status(404).status({ error });
    });
});

// Users routes
Router.post("/users", (req, res) => {
  const { username, token, location } = req.body;

  if (!username || !token || !location || !location.lat || !location.lng) {
    return res.json({
      error: "username, token, lat, and lng are required payloads"
    });
  }

  let { lat, lng } = location;
  lat = Number(lat);
  lng = Number(lng);

  Users.save({ username, token, lat, lng })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/location", (req, res) => {
  const { username, location } = req.body;

  if (!username || !location || !location.lat || !location.lng) {
    return res.json({
      error: "username, token, lat, and lng are required payloads"
    });
  }

  let { lat, lng } = location;
  lat = Number(lat);
  lng = Number(lng);

  Users.updateLocation({ username, lat, lng })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.get("/users/courts/no_interest/:username", (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.json({
      error: "username is a required payload"
    });
  }

  Users.getCourtsOfNoInterest({ username })
    .then(courtsOfNoInterest => res.status(200).json(courtsOfNoInterest))
    .catch(error => res.status(404).json(error));
});

Router.post("/users/courts/no_interest", (req, res) => {
  const { username, courtId } = req.body;

  if (!username || !courtId) {
    return res.json({
      error: "username and courtId are required payloads"
    });
  }

  console.log(
    `Adding court: ${courtId} on user: @${username} list of no interest courts`
  );

  Users.addToCourtsOfNoInterest({ username, courtId })
    .then(success => res.status(200).json(success))
    .catch(error => res.status(404).json(error));
});

Router.delete("/users/courts/no_interest", (req, res) => {
  console.log("In DELETE route /user/courts/no_interest");
  const { username, courtId } = req.body;
  console.log(`Username: ${username} courtId: ${courtId}`);

  if (!username || !courtId) {
    return res.json({
      error: "username and courtId are required payloads"
    });
  }

  console.log(
    `Removing court: ${courtId} on user: @${username} list of no interest courts`
  );

  Users.removeToCourtsOfNoInterest({ username, courtId })
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

Router.delete("/users/:username", (req, res) => {
  const { username } = req.params;

  if (!username) {
    return res.json({
      error: "username is a required request parameter"
    });
  }

  Users.remove({ username })
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
    fileType !== "image/jpeg" ||
    !fileName ||
    !courtId
  ) {
    return res.status(500).json({
      error:
        "fileUrl, fileType, fileName and courtId are required in the body. Only jpeg fileType are allowed"
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

module.exports = Router;
