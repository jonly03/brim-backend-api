// Model for users
// Right now being used for just users who have opted in to receive push notifications

const Users = require("../MongoDB").collection("users");
var locationHelpers = require("../locationHelpers");

const createWithEmail = ({ email }) => {
  return new Promise((resolve, reject) => {
    // Sometimes users will uninstall the app, which will delete their AsyncStorage email
    // Fist check if that email exist
    const emailFailure =
      "We failed to save your email. It's our fault and we are working on fixing it. Try again later";
    Users.find({ email }, (error, docs) => {
      if (error) {
        console.log("Failed to find email with error: ", error);
        reject({ error: emailFailure });
      }

      console.log("Found docs: ", docs);

      if (docs && docs.length > 0) {
        console.log("Email already exists: ", email);
        return resolve({ email: docs[0].email });
      }

      Users.save({ email, courtsOfInterest: "" }, (error, doc) => {
        if (error) {
          console.log("Failed to save new user with email with error: ", error);
          reject({ error: emailFailure });
        }

        console.log("Successfully saved new user with email");
        return resolve({ email });
      });
    });
  });
};

const updateUsername = ({ email, username }) => {
  return new Promise((resolve, reject) => {
    Users.update({ email }, { $set: { username } }, error => {
      if (error) {
        console.log("Failed to save new user username with error", error);
        return reject({ error });
      }

      return resolve({ success: "success" });
    });
  });
};

const getTakenUsernames = () => {
  return new Promise((resolve, reject) => {
    Users.find({}, (error, docs) => {
      if (error) {
        console.log("Failed to find taken usernames with error", error);
        return reject({ error });
      }

      // Filter out users with no usernames
      const usersWithUsernames = docs.filter(user => user.username);
      const takenUsernames = usersWithUsernames.map(user => user.username);
      return resolve({ takenUsernames });
    });
  });
};

const updateToken = ({ email, token }) => {
  return new Promise((resolve, reject) => {
    Users.update({ email }, { $set: { token } }, error => {
      if (error) {
        console.log("Failed to save new user token with error", error);
        return reject({ error });
      }

      return resolve({ success: "success" });
    });
  });
};

const updateLocation = ({ email, lat, lng }) => {
  return new Promise((resolve, reject) => {
    Users.find({ email }, (error, doc) => {
      if (error) {
        return reject({ error });
      }

      if (doc.length === 0) {
        console.log(`${email} does not exist`);
        return resolve({ error: `user: ${email} does not exist` });
      }

      Users.update({ email }, { $set: { lat, lng } }, error => {
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

const addToCourtsOfInterest = ({ email, courtId }) => {
  return new Promise((resolve, reject) => {
    Users.find({ email }, (error, docs) => {
      if (error) {
        return reject({ error });
      }

      if (docs.length === 0) {
        console.log(`${email} does not exist`);
        return resolve({ error: `user: ${email} does not exist` });
      }

      // courtsOfInterest is a comma separated string of courtIds
      // Make sure we don't already have it
      const courtIds =
        docs[0].courtsOfInterest.length > 0
          ? docs[0].courtsOfInterest.split(",")
          : [];
      if (courtIds.indexOf(courtId) !== -1) {
        return resolve({
          success: `Court: ${courtId} already marked as of interest to user: ${email}`
        });
      }

      courtIds.push(courtId);
      const courtsOfInterest =
        courtIds.length > 1 ? courtIds.join(",") : courtIds.toString();

      Users.update({ email }, { $set: { courtsOfInterest } }, error => {
        if (error) {
          console.log(
            `Failed to add court: ${courtId} to user: ${email} courtsOfInterest with error`
          );
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      });
    });
  });
};

const removeFromCourtsOfInterest = ({ email, courtId }) => {
  return new Promise((resolve, reject) => {
    Users.find({ email }, (error, docs) => {
      if (error) {
        return reject({ error });
      }

      if (docs.length === 0) {
        console.log(`${email} does not exist`);
        return resolve({ error: `user: ${email} does not exist` });
      }

      // courtsOfInterest is a comma separated string of courtIds
      // Make sure we have only unique ids
      let courtIds =
        docs[0].courtsOfInterest.length > 0
          ? docs[0].courtsOfInterest.split(",")
          : [];
      const courtIdx = courtIds.indexOf(courtId);
      if (courtIdx === -1) {
        return resolve({
          success: `Court: ${courtId} not marked as a courtsOfInterest to user: ${email}`
        });
      }

      // Remove the court
      courtIds = [
        ...courtIds.slice(0, courtIdx),
        ...courtIds.slice(courtIdx + 1)
      ];
      const courtsOfInterest =
        courtIds.length > 1 ? courtIds.join(",") : courtIds.toString();

      Users.update({ email }, { $set: { courtsOfInterest } }, error => {
        if (error) {
          console.log(
            `Failed to remove court: ${courtId} from user: ${email} courtsOfInterest with error`
          );
          console.log(error);
          return reject({ error });
        }

        return resolve({ success: "success" });
      });
    });
  });
};

const getCourtsOfInterest = ({ email }) => {
  return new Promise((resolve, reject) => {
    Users.find({ email }, (error, docs) => {
      if (error) {
        return reject({ error });
      }

      if (docs.length === 0) {
        console.log(`${email} does not exist`);
        return resolve({ error: `user: ${email} does not exist` });
      }

      const courtIds =
        docs[0].courtsOfInterest.length > 0
          ? docs[0].courtsOfInterest.split(",")
          : [];

      return resolve({ courtIds });
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

const removeToken = ({ email }) => {
  return new Promise((resolve, reject) => {
    Users.update({ email }, { $unset: { token: "" } }, error => {
      if (error) {
        console.log(`Failed to remove user token: ${email}`);
        console.log(error);
        return reject({ error });
      }

      return resolve({ success: "success" });
    });
    // Users.find({ username }, (error, doc) => {
    //   if (error) {
    //     return reject({ error });
    //   }

    //   if (doc.length === 0) {
    //     console.log(`${username} does not exist`);
    //     return resolve({ error: `user: ${username} does not exist` });
    //   }

    //   Users.remove({ username }, error => {
    //     if (error) {
    //       console.log(`Failed to remove user: ${username}`);
    //       console.log(error);
    //       return reject({ error });
    //     }

    //     return resolve({ success: "success" });
    //   });
    // });
  });
};

module.exports = {
  createWithEmail,
  updateUsername,
  getTakenUsernames,
  updateToken,
  updateLocation,
  addToCourtsOfInterest,
  removeFromCourtsOfInterest,
  getCourtsOfInterest,
  getUsersNearAPoint,
  removeToken
  // getUserToken
};
