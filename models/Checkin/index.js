const Checkins = require("../MongoDB").collection("checkins");

const getCheckedInUsers = ({ court_id, requestor, clientId }) => {
  return new Promise((resolve, reject) => {
    Checkins.find({ court_id }, (err, doc) => {
      if (err) {
        reject(err);
      }

      if (!doc || !doc[0]) return resolve([]);

      // Non identified users can check in,
      let checkedInUsers = [];
      const clients_ids = doc[0].clients_ids;

      if (!doc[0].users) {
        //use client_ids to make up usernames if all checkedin users have no usernames
        checkedInUsers = clients_ids.filter(
          client_id => client_id !== clientId
        );
      } else {
        // Make sure to not return the username who initiated this request if they are checked in
        checkedInUsers = doc[0].users.filter(
          user => user.username !== requestor
        );
        // some have usernames some don't
        if (checkedInUsers.length !== clients_ids.length) {
          const newClientsIds = clients_ids.slice(checkedInUsers.length);
          checkedInUsers.concat(
            newClientsIds.filter(client_id => client_id !== clientId)
          );
        }
      }

      resolve(checkedInUsers);
    });
  });
};

module.exports = {
  getCheckedInUsers
};
