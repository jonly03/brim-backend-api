const Users = require("../MongoDB").collection("users");
var locationHelpers = require("../locationHelpers");

const save = ({ username, token, lat, lng }) => {
  return new Promise((resolve, reject) => {
    Users.update(
      { token },
      { $set: { username, lat, lng } },
      { upsert: true },
      error => {
        if (error) {
          console.log("Failed to save new user with error");
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      }
    );
  });
};

const updateLocation = ({ username, lat, lng }) => {
  return new Promise((resolve, reject) => {
    Users.find({ username }, (err, doc) => {
      if (err) {
        console.log(`${username} does not exist`);
        return reject({ error: err });
      }

      Users.update({ username }, { $set: { lat, lng } }, error => {
        if (error) {
          console.log("Failed to update user's location with error");
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      });
    });
  });
};

const getUsersNearAPoint = ({ latLng }) => {
  return locationHelpers.getNearbyDocs({
    latLng,
    model: Users,
    mileRadius: 15
  });
};

// getUserToken = ({ username }) => {
//   return new Promise((resolve, reject) => {
//     Users.findOne({ username }, (err, doc) => {
//       if (err) {
//         console.log(
//           `Failed to retrieve push notification token for username: ${username} with error`
//         );
//         console.log(err);
//         return reject(err);
//       }

//       if (!doc) {
//         return resolve();
//       }

//       return resolve({ token: doc.token });
//     });
//   });
// };

module.exports = {
  save,
  updateLocation,
  getUsersNearAPoint
  // getUserToken
};