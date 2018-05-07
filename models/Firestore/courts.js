const firebase = require('firebase-admin');

let db = require('../../models/Firestore');

// TODO: Add court checkins collections
// TODO: Add user, user reviews, user checkins, user favorites collections
let courtsColRef = db.collection('courts');
let courtReviewsColRef = db.collection('reviews');
let courtPhotosColRef = db.collection('photos');

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
        let { id: courtId, info: courtInfo, checkins, photos, reviews } = court;
        let { name, location:{lat, lng, address}} = courtInfo;
        
        let promises = [];
        
        let saveCourtInfo = courtsColRef.doc(courtId).set({
          name,
          location: new firebase.firestore.GeoPoint(lat, lng),
          address,
          checkins
        })
        promises.push(saveCourtInfo);
        
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

module.exports = {
    save,
    saveOne
}