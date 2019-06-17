const Checkins = require("../MongoDB").collection("checkins");

const getCheckedInUsers = ({ court_id, requestor }) => {
  return new Promise((resolve, reject) => {
    Checkins.find({ court_id }, (err, doc) => {
      if (err) {
        reject(err);
      }

      if (!doc || !doc[0]) return resolve([]);

      let checkedInUsers = doc[0].users;

      // Make sure to not return the username who initiated this request if they are checked in
      // Sometimes requestor can be undefined
      if (!requestor) {
        return resolve(checkedInUsers);
      }
      checkedInUsers = checkedInUsers.filter(
        user => user.username !== requestor
      );
      resolve(checkedInUsers);
    });
  });
};

module.exports = {
  getCheckedInUsers
};
