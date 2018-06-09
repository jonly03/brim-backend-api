const firebase = require('firebase-admin');
const Helpers = require('../../controllers/helpers');

let db = require('../../models/Firestore').firestore;

// TODO: Add court checkins collections
// TODO: Add user, user reviews, user checkins, user favorites collections
let courtsColRef = db.collection('courts');
let courtReviewsColRef = db.collection('reviews');
let courtPhotosColRef = db.collection('photos');
let unsplashPhotosColRef = db.collection('unsplash');

function saveUnsplashPhotos(photos){
    return new Promise((resolve, reject) =>{
        let promises = photos.map(photo =>{
            return unsplashPhotosColRef.doc(photo.id).set({...photo.info});
        })
        
        try{
            Promise.all(promises).then(res => resolve(res));
        }catch(err){
            reject(err);
        }
    })
}

function save(courts){
    return new Promise((resolve, reject) => {
        
        let saveCourts = courts.map(court => saveOne(court));
        try{
            Promise.all(saveCourts).then(res =>{
                resolve(res);
            })
        }catch(err){
            reject(err);
        }
    })
}

function saveOne(court){
    return new Promise((resolve, reject) =>{
        let { id: courtId, info: courtInfo, photos, reviews } = court;
        let { name, location:{lat, lng, address:{street, city, state, postalCode, country}}} = courtInfo;
        
        let promises = [];
        
        if (street === "" || city === "" || postalCode === ""){
            // Force get address from geocoder if we don't have this information
            Helpers.getLatLngAddress(lat, lng).
                then(address =>{
                    let {street, city, state, postalCode, country} = address;
                    let saveCourtInfo = courtsColRef.doc(courtId).set({
                      name,
                      location: new firebase.firestore.GeoPoint(lat, lng),
                      street,
                      city,
                      state,
                      postalCode,
                      country,
                      checkins_current:0,
                      checkins_total:0
                    })
                    promises.push(saveCourtInfo);
                })
        }else{
            let saveCourtInfo = courtsColRef.doc(courtId).set({
              name,
              location: new firebase.firestore.GeoPoint(lat, lng),
              street,
              city,
              state,
              postalCode,
              country,
              checkins_current:0,
              checkins_total:0
            })
            promises.push(saveCourtInfo);
        }
        
        if (photos){ // Some courts don't have photos 
            photos.forEach(photo => {
                promises.push(courtPhotosColRef.doc(photo.id).set({...photo.info}))
            })
        }
        
        if (reviews){ // Some courts don't have reviews
            reviews.forEach(review => {
                promises.push(courtReviewsColRef.doc(review.id).set({...review.info}))
            })
        }
        
        try{
            Promise.all(promises).then(res =>{
                resolve(res);
            })
        }catch(err){
            reject(err)
        }
    })
}

function findCourtsByCity(city){
    console.log(city)
    return new Promise((resolve, reject) => {
        courtsColRef.where('city', '==', city)
            .get()
            .then(qSnap => resolve(qSnap))
            .catch(err => reject(err))
    })
    
}

module.exports = {
    save,
    saveOne,
    saveUnsplashPhotos,
    courtsColRef,
    courtReviewsColRef,
    courtPhotosColRef,
    unsplashPhotosColRef,
    findCourtsByCity
}