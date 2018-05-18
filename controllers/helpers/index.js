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

function getFoursquareQueryParams ( type, near, term = 'basketball') {
    
    // Do a near or latLong search
    // when type is not 'city' near is [lat, lng]
    let searchParam = type === 'city' ? {near} : {ll: near.toString()};
    
    return {
        ...searchParam,
        client_id: process.env.FOURSQUARE_CLIENT_ID,
        client_secret: process.env.FOURSQUARE_CLIENT_SECRET,
        query: term,
        sortByDistance: 1,
        time: 'any',
        day: 'any',
        limit: 50, // max we can get from Foursquare API
        v: CONSTANTS.FOURSQUARE_VERSION_YYYYMMDD
    }
}

function determineSearchParam(type, near){
  
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

function getCourts(type, near){
  return new Promise((resolve, reject) => {
    //const LAT_LONG_ARRAY = [38.568830, -121.467355];
    
    axios({
      method: 'GET',
      url: CONSTANTS.FOURSQUARE_API_BASE_URL + CONSTANTS.FOURSQUARE_SEARCH_ROUTE,
      params: getFoursquareQueryParams(type, near)
    })
    .then(res => {
      // console.log(res.data.response.venues);
      // resolve (res.data.response.groups[0].items)
      resolve(res.data.response.venues)
    })
    .catch(err => {
      reject(err)
    })
  })
}

function getCourtsDetails(foursquareCourts){
  return new Promise( (resolve, reject) => {
    let courtsDetails = foursquareCourts.map(court => getOneCourtDetails(court))
    
    try{
      Promise.all(courtsDetails).then(details =>{
        resolve(details);
      })
    }catch(err){
      reject(err)
    }
  })
}

function getOneCourtDetails(court){
  // get id, name, location, photos, and reviews
  // specify that these courts were from foursquare (type='foursquare' && userId='')
  // initialize checkins to 0
  return new Promise((resolve, reject) =>{
    let { id: courtId} = court;
    
    // TODO: Once we have enough photos, reviews, and user submitted data get rid of these
    let promises = [];
    promises.push(getCourtPhotoPlaceHolders());
    promises.push(getCourtExtraDetails(courtId, 'photos'));
    promises.push(getCourtExtraDetails(courtId, 'tips'));
    
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
        newCourt.info.location = getCourtLocation(court);
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

function getCourtLocation(court){
  // location/isFuzzed (optional, if set to true only get lat & lng)
  // location/address, location/lat, location/lng, location/distance (in m)
  // location/city, location/state, location/postalCode, location/cc
  let location = {};
  location.lat = court.location.lat;
  location.lng = court.location.lng;
  
  if (court.location.distance){
    location.distance = court.location.distance / CONSTANTS.M_TO_MI_RATIO;
  }
  
  location.address = {};
  
  if (!court.location.isFuzzed){
    // Any of these can be undefined, default them to ""
    location.address.street = court.location.address || "";
    location.address.city = court.location.city || "";
    location.address.state = court.location.state || "";
    location.address.postalCode = court.location.postalCode || "";
    location.address.country = court.location.cc || "";
  }
  
  return location;
}

function getCourtExtraDetails(courtId, details){
  return new Promise((resolve, reject) => {
    let queryString = `${CONSTANTS.FOURSQUARE_API_BASE_URL}/${courtId}/${details}`;
    queryString += `?&client_id=${process.env.FOURSQUARE_CLIENT_ID}`;
    queryString += `&client_secret=${process.env.FOURSQUARE_CLIENT_SECRET}`;
    queryString += `&v=${CONSTANTS.FOURSQUARE_VERSION_YYYYMMDD}`;
    
    axios({
      method: 'GET',
      url: queryString
    })
      .then(res => {
        let  items  = res.data.response[details].items;
        if (items){
          return resolve(destructItemsByDetails(items, details, courtId))
        }
        
        resolve ([]);
      })
      .catch(err => {
        reject(err)
      })
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

function destructItemsByDetails(items, details, courtId){
  return items.map(item => {
    switch(details){
      case 'photos':
        return {
          id: uniqid(),
          info:{
            createdAt: item.createdAt,
            url: `${item.prefix}original${item.suffix}`,
            type: 'foursquare',
            likes: 0,
            courtId,
            userId: '' // for photos added by users
          }
        }
      case 'tips':
        return {
          id: uniqid(),
          info:{
            createdAt: item.createdAt,
            text: item.text,
            type: 'foursquare',
            upVotes: 0,
            downVotes: 0,
            courtId,
            userId: '' // for reviews added by users
          }
        }
    }
  })
}