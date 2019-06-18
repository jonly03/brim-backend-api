const Checkins = require("../MongoDB").collection("checkins");

const getCheckedInUsers = ({ court_id, requestor, clientId }) => {
  return new Promise((resolve, reject) => {
    Checkins.find({ court_id }, (err, docs) => {
      if (err) {
        reject(err);
      }

      if (!docs || !docs[0] || !docs[0].users || docs[0].users.length <= 0)
        return resolve([]);

      // Make sure to not return the username who initiated this request if they are checked in
      let checkedInUsers = docs[0].users.filter(
        user => user.client_id !== clientId
      );

      resolve({ checkedInUsers });
    });
  });
};

module.exports = {
  getCheckedInUsers
};
