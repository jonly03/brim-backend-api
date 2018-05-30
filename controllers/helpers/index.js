let axios = require('axios');
let uniqid = require('uniqid');
var geocoder = require('geocoder');

let CourtsDB = require('../../models/Firestore/courts');

let CONSTANTS = require('../../constants');


module.exports = {
    getCourts: function(type, near){
        return new Promise((resolve, reject) => {
          getCourts(type, near).then(courts => {
            return getCourtsDetails(courts);
          }).then(courtsDetails => {
              
              resolve(courtsDetails);
          }).catch(err => {
              reject (err);
          })
        })
    },
    getUnsplashPhotos,
    getLatLngAddress
    
}

function getLatLngAddress(lat, lng){
  return new Promise((resolve, reject) => {
    geocoder.reverseGeocode( lat, lng, function ( err, data ) {
      if (err) reject(err);
      
      const addressParts = data.results[0].formatted_address.split(",");
      console.log(addressParts);
      const street = addressParts[0];
      const city = addressParts[1]
    
      const stateZip = addressParts[2].split(" ");
      const state = stateZip[1];
      const postalCode = stateZip[2];
    
      const country = addressParts[3];
      
      resolve({street, city, state, postalCode, country});
    });
  })
}


function getUnsplashPhotos(){
  return new Promise((resolve, reject) =>{
    axios({
      method: 'GET',
      url:`https://api.unsplash.com/search/photos?client_id=${process.env.UNSPLASH_CLIENT_ID}&page=10&orientation=landscape&query=basketball court`
    })
    .then(res =>{
      let unsplashPhotos = res.data.results.map(photo =>{
        let {id, urls:{raw : url}, user:{username, name: photographer}} = photo;
        return {
          id,
          info:{
            url,
            username,
            photographer
          }
        }
      })
      
      resolve(unsplashPhotos);
    })
    .catch(err =>{
      reject(err)
    })
  })
}


function getOneCourtDetails(court){
  // get id, name, location, photos, and reviews
  // specify that these courts were from google places (type='googleplaces' && userId='')
  // initialize checkins to 0
  return new Promise((resolve, reject) =>{
    let { id: courtId} = court;
    
    // TODO: Once we have enough photos, reviews, and user submitted data get rid of these
    let promises = [];
    promises.push(getCourtPhotoPlaceHolders());
    // promises.push(getCourtExtraDetails(courtId, 'photos'));
    // promises.push(getCourtExtraDetails(courtId, 'tips'));
    
    try{
      Promise.all(promises).then(res =>{
        let [ photoPlaceHolders, photos, reviews ] = res;
        
        // If no photos available for court, give it a place holder
        if (!photos.length){
          const randIdx = Math.floor(Math.random() * photoPlaceHolders.length);
          photos = [{placeHolder: photoPlaceHolders[randIdx]}];
        }
        
        let newCourt = {};
        newCourt.id= court.id;
        newCourt.info = {};
        newCourt.info.name= court.name,
        // newCourt.info.location = getCourtLocation(court);
        newCourt.checkins = {
          total: 0,
          current: 0
        }
        newCourt.photos = photos;
        newCourt.reviews = reviews ? reviews : [];
        
        resolve(newCourt);
      })
    }catch(err){
      reject(err);
    }
  })
}


function getCourtPhotoPlaceHolders(){
  return new Promise((resolve, reject) =>{
    unsplashPhotosColRef.get().then(qSnap =>{
      if (!qSnap.empty()){
        let courtPhotoPlaceHolders = qSnap.map(court => {
          return court.data;
        })
        
        resolve(courtPhotoPlaceHolders);
      }
      else{
        console.log("No Unsplash photos in Firestore DB")
      }
    }).catch(err => reject(err));
  })
  
}

// function destructItemsByDetails(items, details, courtId){
//   return items.map(item => {
//     switch(details){
//       case 'photos':
//         return {
//           id: uniqid(),
//           info:{
//             createdAt: item.createdAt,
//             url: `${item.prefix}original${item.suffix}`,
//             type: 'googleplaces',
//             likes: 0,
//             courtId,
//             userId: '' // for photos added by users
//           }
//         }
//       case 'tips':
//         return {
//           id: uniqid(),
//           info:{
//             createdAt: item.createdAt,
//             text: item.text,
//             type: 'googleplaces',
//             upVotes: 0,
//             downVotes: 0,
//             courtId,
//             userId: '' // for reviews added by users
//           }
//         }
//     }
//   })
// }