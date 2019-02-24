// const mongoDBCollectionRef = require("../MongoDB").collection(
//   "pushNotifications"
// );

// saveUserToken = ({ username, token }) => {
//   return new Promise((resolve, reject) => {
//     mongoDBCollectionRef.save({ username, token }, error => {
//       if (error) {
//         console.log("Failed to save push notification token with error");
//         console.log(error);
//         return reject({ error });
//       }

//       return resolve({ success: "success" });
//     });
//   });
// };

// getUserToken = ({ username }) => {
//   return new Promise((resolve, reject) => {
//     mongoDBCollectionRef.findOne({ username }, (err, doc) => {
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

// module.exports = {
//   saveUserToken,
//   getUserToken
// };
