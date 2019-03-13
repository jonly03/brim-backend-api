var geodist = require("geodist");

async function tryGettingNearby({ latLng, model, mileRadius }) {
  // Find documents in model near latLng
  // Use mileRadius when given, otherwise do a grid search of 15-30 mi radius
  return new Promise(async (resolve, reject) => {
    let mileRadiusesToTry = mileRadius ? [mileRadius] : [15, 20, 25, 30];
    let idx = 0;
    let docs = [];
    do {
      try {
        console.log(
          `Trying documents in ${model} model near ${
            mileRadiusesToTry[idx]
          } miles of {lat: ${latLng.lat}, lng: ${latLng.lng}}...`
        );
        docs = await getDocsNearBy({
          latLng,
          radius: mileRadiusesToTry[idx++],
          model
        });
      } catch (err) {
        reject(err);
      }
    } while (docs.length === 0 && idx < mileRadiusesToTry.length);

    resolve({ dist: mileRadiusesToTry[idx - 1], docs });
  });
}

function getDocsNearBy({ latLng, radius, model }) {
  // TODO: Handle pagination
  // Get data in batches
  return new Promise((resolve, reject) => {
    let boundingBox = getBoundingBox({ point: latLng, distInMiles: radius });

    model.find(
      {
        lat: { $lt: boundingBox.max.lat },
        lat: { $gt: boundingBox.min.lat }
      },
      (err, docs) => {
        if (err) {
          console.log(
            `Error getting documents in a ${radius}mi radius of {lat: ${
              latLng.lat
            }, lng: ${latLng.lng}}: ${err}`
          );
          reject(err);
        }

        docs = docs.filter(doc => {
          const { lat, lng } = doc;

          // results are only filtered by latitude, filter them again
          return isWithin({ point: { lat, lng }, boundingBox });
        });
        resolve(sortByNearest({ latLng, docs }));
      }
    );
  });
}

function getBoundingBox({ point, distInMiles }) {
  // 1deg of Lat ~= 69mi
  // 1deg of Lng ~= 55.2428
  let oneLatDegInMiles = 1 / 69;
  let onLngDegInMiles = 1 / 55.2428;

  let { lat, lng } = point;

  let latOffset = oneLatDegInMiles * distInMiles;
  let lngOffset = onLngDegInMiles * distInMiles;

  let lowerLat = lat - latOffset;
  let lowerLng = lng - lngOffset;

  let greaterLat = lat + latOffset;
  let greaterLng = lng + lngOffset;

  return {
    min: {
      lat: lowerLat,
      lng: lowerLng
    },
    max: {
      lat: greaterLat,
      lng: greaterLng
    }
  };
}

function isWithin({ point, boundingBox }) {
  return (
    point.lat > boundingBox.min.lat &&
    point.lat < boundingBox.max.lat &&
    point.lng > boundingBox.min.lng &&
    point.lng < boundingBox.max.lng
  );
}

function sortByNearest({ latLng, docs }) {
  let sortedDocs = docs.map(doc => {
    const { lat: docLat, lng: docLng } = doc;

    // Calculate distance from current location and add dist property to each doc
    var dist = geodist(
      { lat: latLng.lat, lon: latLng.lng },
      { lat: docLat, lon: docLng },
      { exact: true, unit: "mi" }
    ).toFixed(1);
    doc.dist = Number(dist);
    return doc;
  });

  return sortedDocs.sort((doc1, doc2) => doc1.dist - doc2.dist);
}

module.exports = {
  getNearbyDocs: tryGettingNearby
};
