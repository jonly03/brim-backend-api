const Checkins = require("../MongoDB").collection("checkins");

const getCheckedInUsers = ({ court_id }) => {
  return new Promise((resolve, reject) => {
    Checkins.find({ court_id }, (err, doc) => {
      if (err) {
        reject(err);
      }

      if (!doc || !doc[0]) return resolve([]);

      resolve(doc[0].usernames);
    });
  });
};

module.exports = {
  getCheckedInUsers
};
