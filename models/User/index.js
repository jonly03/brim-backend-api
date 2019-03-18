// Model for users
// Right now being used for just users who have opted in to receive push notifications

const Users = require("../MongoDB").collection("users");
var locationHelpers = require("../locationHelpers");

const save = ({ username, token, lat, lng }) => {
  return new Promise((resolve, reject) => {
    Users.update(
      { token },
      { $set: { username, lat, lng, courtsOfNoInterest: "" } },
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
    Users.find({ username }, (error, doc) => {
      if (error) {
        return reject({ error });
      }

      if (doc.length === 0) {
        console.log(`${username} does not exist`);
        return resolve({ error: `user: ${username} does not exist` });
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

const addToCourtsOfNoInterest = ({ username, courtId }) => {
  return new Promise((resolve, reject) => {
    Users.find({ username }, (error, docs) => {
      if (error) {
        return reject({ error });
      }

      if (docs.length === 0) {
        console.log(`${username} does not exist`);
        return resolve({ error: `user: ${username} does not exist` });
      }

      // courtsOfNoInterest is a comma separated string of courtIds
      // Make sure we don't already have it
      const courtIds =
        docs[0].courtsOfNoInterest.length > 0
          ? docs[0].courtsOfNoInterest.split(",")
          : [];
      if (courtIds.indexOf(courtId) !== -1) {
        return resolve({
          success: `Court: ${courtId} already marked as non interesting to user: ${username}`
        });
      }

      courtIds.push(courtId);
      const courtsOfNoInterest =
        courtIds.length > 1 ? courtIds.join(",") : courtIds.toString();

      Users.update({ username }, { $set: { courtsOfNoInterest } }, error => {
        if (error) {
          console.log(
            `Failed to add court: ${courtId} to user: ${username} courtsOfNoInterest with error`
          );
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      });
    });
  });
};

const removeToCourtsOfNoInterest = ({ username, courtId }) => {
  return new Promise((resolve, reject) => {
    Users.find({ username }, (error, docs) => {
      if (error) {
        return reject({ error });
      }

      if (docs.length === 0) {
        console.log(`${username} does not exist`);
        return resolve({ error: `user: ${username} does not exist` });
      }

      // courtsOfNoInterest is a comma separated string of courtIds
      // Make sure we have only unique ids
      let courtIds =
        docs[0].courtsOfNoInterest.length > 0
          ? docs[0].courtsOfNoInterest.split(",")
          : [];
      const courtIdx = courtIds.indexOf(courtId);
      if (courtIdx === -1) {
        return resolve({
          success: `Court: ${courtId} already not in the courtsOfNoInterest to user: ${username}`
        });
      }

      // Remove the court
      courtIds = [
        ...courtIds.slice(0, courtIdx),
        ...courtIds.slice(courtIdx + 1)
      ];
      const courtsOfNoInterest =
        courtIds.length > 1 ? courtIds.join(",") : courtIds.toString();

      Users.update({ username }, { $set: { courtsOfNoInterest } }, error => {
        if (error) {
          console.log(
            `Failed to remove court: ${courtId} from user: ${username} courtsOfNoInterest with error`
          );
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

const remove = ({ username }) => {
  return new Promise((resolve, reject) => {
    Users.find({ username }, (error, doc) => {
      if (error) {
        return reject({ error });
      }

      if (doc.length === 0) {
        console.log(`${username} does not exist`);
        return resolve({ error: `user: ${username} does not exist` });
      }

      Users.remove({ username }, error => {
        if (error) {
          console.log(`Failed to remove user: ${username}`);
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      });
    });
  });
};

// getUserToken = ({ username }) => {
//   return new Promise((resolve, reject) => {
//     Users.findOne({ username }, (error, doc) => {
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
  addToCourtsOfNoInterest,
  removeToCourtsOfNoInterest,
  getUsersNearAPoint,
  remove
  // getUserToken
};
