// const {firebase, firestore} = require('../../Firestore')
const mongoDB = require("../../MongoDB");
const NodeGeocoder = require("node-geocoder");
var geodist = require("geodist");
var locationHelpers = require("../../locationHelpers");

// node-geocoder config with google places api key
const nodeGeocoderOptions = {
  provider: "google",
  apiKey: process.env.PLACES_API_KEY
};
const geocoder = NodeGeocoder(nodeGeocoderOptions);

// const firestoreCourtsRef = firestore.collection('courts');
const mongoDBCourtsRef = mongoDB.collection("courts");
// const firestoreCheckinsRef = firestore.collection('checkins');
const mongoDBCheckinsRef = mongoDB.collection("checkins");
const mongoDBOnlineRef = mongoDB.collection("online");

function getLocDetails(coords) {
  return new Promise((resolve, reject) => {
    geocoder
      .reverse({ lat: coords.lat, lon: coords.lng })
      .then(res => {
        const locDetails = res[0];

        // Address
        const address = locDetails.formattedAddress;

        // country (last idx)
        const addressParts = address.split(",");
        const lastIdx = addressParts.length - 1;
        let country = addressParts[lastIdx].trim();
        if (!country) {
          country = locDetails.countryCode;
        }

        //city
        let city = locDetails.city;
        if (!city) {
          city = locDetails.administrativeLevels.level2long;
        }

        // const geoPoint = new firebase.firestore.GeoPoint(coords.lat, coords.lng);

        resolve({ ...coords, /*geoPoint,*/ city, country, address });
      })
      .catch(err => {
        reject(err);
      });
  });
}

// function getBoundingBox(point, distInMiles) {
// 	// 1deg of Lat ~= 69mi
// 	// 1deg of Lng ~= 55.2428
// 	let oneLatDegInMiles = 1 / 69;
// 	let onLngDegInMiles = 1 / 55.2428;

// 	let { lat, lng } = point;

// 	let latOffset = oneLatDegInMiles * distInMiles;
// 	let lngOffset = onLngDegInMiles * distInMiles;

// 	let lowerLat = lat - latOffset;
// 	let lowerLng = lng - lngOffset;

// 	let greaterLat = lat + latOffset;
// 	let greaterLng = lng + lngOffset;

// 	return {
// 		min: {
// 			lat: lowerLat,
// 			lng: lowerLng
// 		},
// 		max: {
// 			lat: greaterLat,
// 			lng: greaterLng
// 		}
// 	}
// }

// function isWithin(point, boundingBox) {
// 	return point.lat > boundingBox.min.lat &&
// 		point.lat < boundingBox.max.lat &&
// 		point.lng > boundingBox.min.lng &&
// 		point.lng < boundingBox.max.lng;
// }

// async function tryGettingNearbyCourtsFirestore(latLng){
//     // Try 15 mi radius first, if no courts keep incrementing
//     // Give up after 30 mi radius
//     return new Promise(async (resolve, reject) =>{
// 		let mileRadiusesToTry = [15, 20, 25, 30];
// 		let idx = 0;
// 		let courts = [];
// 		do{
// 			try{
// 				console.log(`Trying getting courts near ${mileRadiusesToTry[idx]} miles...`);
// 				courts = await getCourtsNearByFirestore(latLng, mileRadiusesToTry[idx++]);
// 			} catch(err){
// 				reject(err);
// 			}
// 		}
// 		while (courts.length === 0 && idx < mileRadiusesToTry.length)

// 		resolve({dist: mileRadiusesToTry[idx-1], courts});
//     })
// }

async function tryGettingNearbyCourtsMongoDB(latLng) {
  return locationHelpers.getNearbyDocs({ latLng, model: mongoDBCourtsRef });
  // // Try 15 mi radius first, if no courts keep incrementing
  // // Give up after 30 mi radius
  // return new Promise(async (resolve, reject) => {
  // 	let mileRadiusesToTry = [15, 20, 25, 30];
  // 	let idx = 0;
  // 	let courts = [];
  // 	do {
  // 		try {
  // 			console.log(`Trying getting courts near ${mileRadiusesToTry[idx]} miles...`);
  // 			courts = await getCourtsNearByMongoDB(latLng, mileRadiusesToTry[idx++]);
  // 		} catch (err) {
  // 			reject(err);
  // 		}
  // 	}
  // 	while (courts.length === 0 && idx < mileRadiusesToTry.length)

  // 	resolve({ dist: mileRadiusesToTry[idx - 1], courts });
  // })
}

// function getCourtsNearByMongoDB(latLng, radius) {
// 	// TODO: Handle pagination
// 	// Get data in batches
// 	return new Promise((resolve, reject) => {
// 		let boundingBox = getBoundingBox(latLng, radius);

// 		mongoDBCourtsRef.find({
// 			lat: { $lt: boundingBox.max.lat },
// 			lat: { $gt: boundingBox.min.lat }
// 		}, (err, courts) => {
// 			if (err) {
// 				console.log("Error getting nearby courts: ", err);
// 				reject(err)
// 			}

// 			courts = courts.filter(court => {
// 				const { lat: courtLat, lng: courtLng } = court;

// 				// results are only filtered by latitude, filter them again
// 				return isWithin({ lat: courtLat, lng: courtLng }, boundingBox)
// 			});
// 			resolve(sortByNearestMongoDB(latLng, courts));
// 		})
// 	})
// }

function getAllCourts() {
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.find({}, (err, courts) => {
      if (err) {
        reject(err);
      }

      resolve(courts);
    });
  });
}

function getOneCourt(id) {
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.find({ _id: id }, (err, court) => {
      if (err) {
        reject(err);
      }

      resolve(court);
    });
  });
}

function addCourtPhoto({ courtId, photoUrl }) {
  console.log("adding court photos");
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.update(
      { _id: courtId },
      { $addToSet: { photos: photoUrl }, $inc: { photos_total: 1 } },
      { upsert: false, multi: false, new: true },
      (err, doc) => {
        if (err) {
          console.log(err);
          return reject();
        }
        mongoDBCourtsRef.find({ _id: courtId }, (err, doc) => {
          if (err) {
            console.log(err);
            return reject();
          }
          return resolve(doc[0]);
        });
      }
    );
  });
}

function removeCourt({ courtId }) {
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.remove({ _id: courtId }, (err, doc) => {
      if (err) return reject(err);
      return resolve();
    });
  });
}

function updateCourt({ courtId, updates }) {
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.update(
      { _id: courtId },
      { $set: { ...updates } },
      (err, doc) => {
        if (err) return reject(err);
        return resolve();
      }
    );
  });
}

function addNewCourt({ court }) {
  console.log("adding new court ");
  return new Promise((resolve, reject) => {
    const { _id, name, address, lat, lng, city, country, photos } = court;
    const courtInfo = {
      _id,
      name,
      address,
      lat,
      lng,
      city,
      country,
      photos,
      photos_total: photos.length,
      checkins_current: 0,
      checkins_total: 0,
      favs_total: 0,
      reviews_total: 0,
      nearby_online_count: 0
    };

    // Update who is around this court by checking how many people are around the nearest court in 15 mi radius
    locationHelpers
      .getNearbyDocs({
        latLng: { lat, lng },
        model: mongoDBCourtsRef,
        mileRadius: 15
      })
      .then(res => {
        let { docs: courts } = res;
        if (courts && courts.length > 0) {
          courtInfo.nearby_online_count = courts[0].nearby_online_count;
        }
        mongoDBCourtsRef.insert(courtInfo, (error, doc) => {
          if (error) {
            console.log(error);
            return reject(error);
          }
          return resolve();
        });
      })
      .catch(error => {
        console.log(
          `failed to get courts near new court at lat:${lat}, lng: ${lng}`
        );
      });
  });
}

// function getCourtsNearByFirestore(latLng, radius) {
// 	// TODO: Handle pagination
// 	// Get data in batches
//     return new Promise((resolve, reject) => {
//         let boundingBox = getBoundingBox(latLng, radius);

//         let lesserGeopoint = new firebase.firestore.GeoPoint(boundingBox.min.lat, boundingBox.min.lng);
//         let greaterGeopoint = new firebase.firestore.GeoPoint(boundingBox.max.lat, boundingBox.max.lng)

//         let query = firestoreCourtsRef
//             .where("geoPoint", ">", lesserGeopoint)
//             .where("geoPoint", "<", greaterGeopoint)
//             .get()
//             .then((querySnap) => {

//                 let courts = querySnap.docs;
//                 courts = courts.filter(doc =>{
//                     let court = doc.data();
//                     const {latitude: courtLat, longitude: courtLng} = court.geoPoint;

//                     // results are only filtered by latitude, filter them again
//                     return isWithin({lat:courtLat, lng: courtLng}, boundingBox)
//                 });

//                 resolve(sortByNearestFirestore(latLng, courts));
//             })

//             .catch(function(err) {
//                 console.log("Error getting nearby courts: ", err);
//                 reject(err);
//             });
//     })
// }

function getCourtsByCity() {
  // TODO: eventually give people a way to query courts by city
}

function getCourtsByZipocode() {
  // TODO: eventually give people a way to query courts by zipcode
}

function getCourtsByState() {
  // TODO: eventually give people a way to query courts by state
}

function getCourtsByCountry() {
  // TODO: eventually give people a way to query courts by country
}

// function sortByNearestFirestore(latLng, courtsList){
// 	let courts = courtsList.map(court => {
//         let tempCourt = court.data();

//         const {latitude: courtLat, longitude: courtLng} = tempCourt.geoPoint;

//         // Calculate distance from current location and add dist property to each court
//         var dist = geodist({lat: latLng.lat, lon: latLng.lng},
//                         {lat: courtLat, lon: courtLng},
//                         {exact: true, unit: 'mi'}).toFixed(1);
//         tempCourt.dist = Number(dist);
//         return tempCourt;

//     });

//     return courts.sort((court1, court2) => court1.dist - court2.dist);
// }

function sortByNearestMongoDB(latLng, courtsList) {
  let courts = courtsList.map(court => {
    // let tempCourt = court.data();

    const { lat: courtLat, lng: courtLng } = court;

    // Calculate distance from current location and add dist property to each court
    var dist = geodist(
      { lat: latLng.lat, lon: latLng.lng },
      { lat: courtLat, lon: courtLng },
      { exact: true, unit: "mi" }
    ).toFixed(1);
    court.dist = Number(dist);
    return court;
  });

  return courts.sort((court1, court2) => court1.dist - court2.dist);
}

function checkin({ clientId, courtId, username, checkInTime }) {
  return new Promise((resolve, reject) => {
    // Find the court and increase the current and total checkins
    //     firestoreCourtsRef.doc(courtId).get().then(doc =>{
    // 		if (doc.exists){
    // 			let {checkins_current, checkins_total} = doc.data();
    // 			checkins_current += 1;
    // 			checkins_total += 1;

    // 			doc.ref.update({checkins_current, checkins_total}).then(() =>{
    // 				console.log(`Done updating the current & total checkins for courts/${courtId}`);
    // 				resolve({current:checkins_current, total:checkins_total});
    // 			})

    // 		}else{
    // 			console.log(`Firestore courts/${courtId} doesn't exist`);
    // 			reject();
    // 		}
    // 	})
    console.log(
      `Anonymously checking clientId/${clientId} into courtId/${courtId}`
    );
    // Add the checkin record for the court then increment checkins for court
    // First try to find it
    mongoDBCheckinsRef.find({ court_id: courtId }, (err, docs) => {
      if (err) {
        console.log("Failed to find checkin record for court_id: ", courtId);
        return reject(err);
      }
      if (!docs || docs.length <= 0) {
        console.log(
          "Nobody checked into this court yet. Creating new checkin record"
        );
        const newCheckinRecord = {
          court_id: courtId
        };
        const user = {
          client_id: clientId,
          checkInTime
        };
        if (username) {
          user.username = username;
        }

        newCheckinRecord.users = [user];
        mongoDBCheckinsRef.save(newCheckinRecord, (err, doc) => {
          if (err) {
            console.log("Failed to save new checkin record");
            reject(err);
          } else {
            // Increment checkins for court
            mongoDBCourtsRef.findAndModify(
              {
                query: { _id: courtId },
                update: {
                  $inc: {
                    checkins_current: 1,
                    checkins_total: 1
                  }
                },
                new: true
              },
              (err, doc) => {
                if (err) {
                  console.log(err);
                  return reject(err);
                }

                console.log("new doc after checkin into court");
                console.log(doc);
                resolve({
                  current: doc.checkins_current,
                  total: doc.checkins_total
                });
              }
            );
          }
        });
      } else {
        console.log(
          "Somebody already checked into this court already. Adding to client_ids and users sets"
        );
        const newUser = {
          client_id: clientId,
          checkInTime
        };
        if (username) {
          // Make sure that we save the checkedin users if they have them
          newUser.username = username;
        }

        mongoDBCheckinsRef.update(
          { court_id: courtId },
          {
            $addToSet: { users: newUser }
          },
          (err, doc) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              // Increment checkins for court
              mongoDBCourtsRef.findAndModify(
                {
                  query: { _id: courtId },
                  update: {
                    $inc: {
                      checkins_current: 1,
                      checkins_total: 1
                    }
                  },
                  new: true
                },
                (err, doc) => {
                  if (err) {
                    console.log(err);
                    return reject(err);
                  }

                  console.log("new doc after checkin into court");
                  console.log(doc);
                  resolve({
                    current: doc.checkins_current,
                    total: doc.checkins_total
                  });
                }
              );
            }
          }
        );
      }
    });
  });
}

function checkout({ clientId, courtId }) {
  return new Promise((resolve, reject) => {
    // Find the court and decrease the current checkins
    //     firestoreCourtsRef.doc(courtId).get().then(doc =>{
    // 		if (doc.exists){
    // 			let {checkins_current} = doc.data();
    // 			if (checkins_current > 0){
    // 			    // Make sure to never have a negative checkin current count
    //     			checkins_current -= 1;

    //     			doc.ref.update({checkins_current}).then(() =>{
    //     				console.log(`Done checking out of the court/${courtId}`);
    //     				resolve({current: checkins_current});
    //     			})
    // 			}

    // 		}else{
    // 			console.log(`Firestore courts/${courtId} doesn't exist`);
    // 			reject();
    // 		}
    // 	})

    console.log("In checkout function...");
    console.log(`clientId/${clientId} courtId/${courtId}`);

    // Remove checkin record for court then decrement checkins for court
    let pullUpdateQuery = { users: { client_id: clientId } };

    mongoDBCheckinsRef.findAndModify(
      {
        query: { court_id: courtId },
        update: { $pull: pullUpdateQuery },
        new: true
      },
      (err, doc) => {
        if (err) {
          console.log(err);
          reject(err);
        }

        console.log("new document after update...");
        console.log(doc);

        // remove the court record if no one is left checked in
        // No need to wait for this operation
        if (doc && doc.users && doc.users.length <= 0) {
          console.log("no one left checkedin after update...");
          console.log("removing court record...");
          mongoDBCheckinsRef.remove({ court_id: courtId }, err => {
            if (err) {
              console.log(err);
              // reject(err);
            }
            console.log(
              "Done removing court record because no one was left checked in"
            );

            decrementCourtCheckins(courtId)
              .then(courtInfo => {
                console.log("Done decrementing checkins for court");
                resolve(courtInfo);
              })
              .catch(err => {
                console.log("Failed to decrement checkins");
                reject(err);
              });
          });
        } else {
          decrementCourtCheckins(courtId)
            .then(courtInfo => {
              console.log("Done decrementing checkins for court");
              resolve(courtInfo);
            })
            .catch(err => {
              console.log("Failed to decrement checkins");
              reject(err);
            });
        }
      }
    );
  });
}

function checkoutOnDisconnect({ clientId }) {
  console.log(
    `Checking clientId/${clientId} out from any court they were checked into due to disconnection`
  );
  return new Promise((resolve, reject) => {
    // Before getting rid of checkin record, get court id so we can decrement checkin count
    // Client should have been only checked into one court
    console.log(`clientId/${clientId}`);
    mongoDBCheckinsRef.findOne({ "users.client_id": clientId }, (err, doc) => {
      if (err) {
        console.log(err);
        reject(err);
      }

      // Every disconnected client might not be checked into any courts
      if (doc === null || !doc) {
        console.log(`ClientId/${clientId} is not checked in anywhere`);
        return resolve();
      }

      const { court_id: courtId } = doc;
      console.log(`ClientId/${clientId} was checked into courtId/${courtId}`);
      console.log("Checking them out...");

      resolve(checkout({ clientId, courtId }));
      // let pullUpdateQuery = { clients_ids: clientId };
      // mongoDBCheckinsRef.findAndModify(
      //   {
      //     query: { court_id: courtId },
      //     update: { $pull: pullUpdateQuery },
      //     new: true
      //   },
      //   (err, doc) => {
      //     if (err) {
      //       console.log(err);
      //       reject(err);
      //     }

      //     // remove the court record if no one is left checked in
      //     // No need to wait for this operation
      //     if (doc.clients_ids && !doc.clients_ids.length) {
      //       console.log("no one left checkedin after update...");
      //       console.log("removing court record...");
      //       mongoDBCheckinsRef.remove({ court_id: courtId }, err => {
      //         if (err) {
      //           console.log(err);
      //           // reject(err);
      //         }
      //         console.log(
      //           "Done removing court record because no one was left checked in"
      //         );
      //       });
      //     }
      //     decrementCourtCheckins(courtId)
      //       .then(checkins => {
      //         console.log("Done decrementing checkins for court");
      //         resolve({ courtId, checkins });
      //       })
      //       .catch(err => {
      //         console.log("Failed to decrement checkins");
      //         reject(err);
      //       });
      //   }
      // );
    });
  });
}

// function removeUsernameOnCheckout({ username }) {
//   console.log(`Removing user/@${username} from checkins`);

//   return new Promise((resolve, reject) => {
//     mongoDBCheckinsRef.findOne(
//       { "users.username": { $in: [username] } },
//       (err, doc) => {
//         if (err) {
//           console.log(err);
//           reject(err);
//         }

//         if (doc === null || !doc) {
//           console.log(`User/@${username} is not checked in anywhere`);
//           return resolve();
//         }

//         const { court_id: courtId } = doc;
//         console.log(`User/@${username} was checked into courtId/${courtId}`);
//         console.log("Removing them from checkedins...");

//         mongoDBCheckinsRef.findAndModify(
//           {
//             query: { court_id: courtId },
//             update: { $pull: { users: { username } } },
//             new: true
//           },
//           (err, doc) => {
//             if (err) {
//               console.log(err);
//               reject(err);
//             }
//             resolve();
//           }
//         );
//       }
//     );
//   });
// }

function decrementCourtCheckins(courtId) {
  console.log(`Decrementing current checkins at courtId/${courtId}...`);
  return new Promise((resolve, reject) => {
    mongoDBCourtsRef.findAndModify(
      {
        query: { _id: courtId, checkins_current: { $gt: 0 } },
        update: { $inc: { checkins_current: -1 } },
        new: true
      },
      (err, doc) => {
        if (err) {
          console.log(err);
          return reject(err);
        }

        console.log("new doc after checkout of court");
        console.log(doc);

        resolve(doc);
      }
    );
  });
}

function isClientOnline(clientId) {
  console.log(`Checking if clientId/${clientId} is already online...`);
  return new Promise((resolve, reject) => {
    mongoDBOnlineRef.find({ client_id: clientId }, (err, doc) => {
      if (err) {
        console.log(
          `Failed to check if clientId/${clientId} is already online`
        );
        reject(err);
      }

      resolve(doc.length ? true : false);
    });
  });
}

function incrementCourtsNearbyOnlineCounts(clientId, coords) {
  console.log(
    `Incrementing nearby online counts for courts found near clientId/${clientId}...`
  );
  return new Promise((resolve, reject) => {
    // First, add clientId to online records to be able to know their coords when they disconnect so that we can notify courts near them to decrement they nearby online counts
    console.log(`Adding clientId/${clientId} to online records`);
    mongoDBOnlineRef.update(
      { client_id: clientId },
      { $set: { lat: coords.lat, lng: coords.lng } },
      { upsert: true },
      (err, doc) => {
        if (err) {
          console.log(err);
          reject(err);
        }

        // Second find all courts nearby and increment their nearby online counts
        console.log(`Finding courts near clientId/${clientId}...`);
        tryGettingNearbyCourtsMongoDB(coords).then(res => {
          let { docs: courts } = res;

          let courtIds = [];
          if (!courts || courts.length <= 0) {
            console.log(`No courts found near clientId/${clientId}`);
            return resolve(courtIds);
          }

          let queries = courts.map(court => {
            courtIds.push(court._id);
            return { _id: court._id };
          });

          console.log("Built queries to match all nearby courts");
          console.log(queries);

          // With no 1 cmd to update many documents and return the new updated documents, update them all and just return the courtIds
          console.log(`Found courts near clientId/${clientId}`);
          console.log(`Incrementing their nearby online counts...`);
          mongoDBCourtsRef.update(
            { $or: [...queries] },
            { $inc: { nearby_online_count: 1 } },
            { multi: true },
            err => {
              if (err) {
                console.log(err);
                return reject(err);
              }

              console.log(
                `Done incrementing nearby online counts for courts found near clientId/${clientId}`
              );
              resolve(courtIds);
            }
          );
        });
      }
    );
  });
}

function decrementCourtsNearbyOnlineCounts(clientId) {
  console.log(
    `Decrementing nearby online counts for courts found near clientId/${clientId} due to disconnetion`
  );
  return new Promise((resolve, reject) => {
    // First, find clientId from online records to get their coords then remove them from the online records
    console.log(`Finding clientId/${clientId} from online records`);
    mongoDBOnlineRef.findOne({ client_id: clientId }, (err, doc) => {
      if (err) {
        console.log(err);
        reject(err);
      }

      if (!doc) return resolve([]);

      // Assume that the client exists, so the doc can't be undefined or null
      console.log(`Found clientId/${clientId} in online records.`);
      let coords = { lat: doc.lat, lng: doc.lng };

      // No need for a callback
      mongoDBOnlineRef.remove({ client_id: clientId }, err => {
        if (err) {
          console.log(
            `Failed to remove clientId/${clientId} from online records`
          );
          return reject(err);
        }

        console.log(`Removed clientId/${clientId} from online records.`);
      });

      // Second find all courts nearby and decrement their nearby online counts
      console.log(`Finding courts near where clientId/${clientId} was ...`);
      tryGettingNearbyCourtsMongoDB(coords).then(res => {
        let { docs: courts } = res;

        let courtIds = [];
        if (courts.lenght <= 0) {
          console.log(`No courts found near clientId/${clientId}`);
          return resolve(courtIds);
        }

        let queries = courts.map(court => {
          courtIds.push(court._id);
          return { _id: court._id, nearby_online_count: { $gt: 0 } };
        });

        console.log(
          "Built queries to match all nearby courts with at least 1 online client nearby"
        );
        console.log(queries);

        // With no 1 cmd to update many documents and return the new updated documents, update them all and just return the courtIds
        console.log(`Found courts near clientId/${clientId}`);
        console.log(`Decrementing their nearby online counts...`);
        mongoDBCourtsRef.update(
          { $or: [...queries] },
          { $inc: { nearby_online_count: -1 } },
          { multi: true },
          err => {
            if (err) {
              console.log(err);
              return reject(err);
            }

            console.log(
              `Done decrementing nearby online counts for courts found near clientId/${clientId}`
            );
            resolve(courtIds);
          }
        );
      });
    });
  });
}

module.exports = {
  getLocDetails,
  // tryGettingNearbyCourtsFirestore,
  getNearbyCourts: tryGettingNearbyCourtsMongoDB,
  getAllCourts,
  getOneCourt,
  addCourtPhoto,
  addNewCourt,
  removeCourt,
  updateCourt,
  checkin,
  checkout,
  checkoutOnDisconnect,
  // removeUsernameOnCheckout,
  isClientOnline,
  incrementCourtsNearbyOnlineCounts,
  decrementCourtsNearbyOnlineCounts
};
