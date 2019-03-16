let helpers = require("./helpers");

// const firestoreCollectionRef = require('../../Firestore').firestore.collection('courts');
const mongoDbCollectionRef = require("../../MongoDB").collection("courts");

function saveOneCourtInfo(id, name, location) {
  return new Promise((resolve, reject) => {
    helpers
      .getLocDetails(location)
      .then(locDetails => {
        let courtDetails = {
          name,
          checkins_current: NumberInt(0),
          checkins_total: NumberInt(0),
          favs_total: NumberInt(0),
          photos_total: NumberInt(0),
          reviews_total: NumberInt(0),
          nearby_online_count: NumberInt(0),
          _id: id,
          ...locDetails
        };

        // firestoreCollectionRef.doc(id).set(courtDetails)
        mongoDbCollectionRef.update(
          { _id: id },
          courtDetails,
          { upsert: true },
          function(err) {
            if (err) return reject(err);
            return resolve();
          }
        );
      })
      .catch(err => reject(err));
  });
}

module.exports = {
  // firestoreCollectionRef,
  mongoDbCollectionRef,
  save: saveOneCourtInfo
};
