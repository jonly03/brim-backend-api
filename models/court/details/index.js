let helpers = require('./helpers');

// const firestoreCollectionRef = require('../../Firestore').firestore.collection('courts');
const mongoDbCollectionRef = require('../../MongoDB').collection('courts');

function saveOneCourtInfo(id, name, location){
	return new Promise((resolve, reject) => {
		helpers.getLocDetails(location)
			.then(locDetails => {
				let courtDetails = {
					name, 
					checkins_current:0,
                    checkins_total:0, 
                    favs_total:0, 
                    photos_total:0,
					reviews_total: 0,
					nearby_online_count: 0,
                    _id: id,
                    ...locDetails
                }

				// firestoreCollectionRef.doc(id).set(courtDetails)
				mongoDbCollectionRef.update({_id: id}, courtDetails, {upsert: true}, function(err){
					if (err) return reject(err);
					return resolve();
				})
			})
			.catch(err => reject(err));
	})
}

module.exports = {
	// firestoreCollectionRef,
	mongoDbCollectionRef,
    save: saveOneCourtInfo
}