let express = require('express');

let helpers = require('./helpers');
let courtHelpers = require('../../models/court/details/helpers');
let courtPhotosHelpers = require('../../models/court/photos');
let db = require('../../models/Firestore').firestore;

let Router = express.Router();

// Router.get('/courts/unsplash', (req, res) =>{
//     Helpers.getUnsplashPhotos().then(unsplashPhotos =>{
        
//         res.status(200).json(unsplashPhotos)
//         CourtsDB.saveUnsplashPhotos(unsplashPhotos)
//         .then(res => {
//             // console.log(res.length);
//             // console.log(res);
//         })
//         .catch(err => {
//             res.status(500).json(err);
//         })
//     })
// })

// Router.get('/courts/city/:city', function(req, res){
//     Helpers.getCourts('city', req.params.city).then(courts => {
//         res.status(200).json(courts);
        
//         CourtsDB.save(courts).then(res => {
//             // console.log(res.length);
//             // console.log(res);
//         })
//     }).catch(err => {
//         res.status(500).json(err);
//     })
// })

Router.get('/courts/latLng/:lat/:lng', function(req, res){
    let {lat, lng} = req.params;
    
    // Only get courts from our Firestore
    courtHelpers.tryGettingNearbyCourts({lat: Number(lat), lng:Number(lng)})
        .then(courtsRes =>{
            console.log("Done getting nearby courts.");
            console.log("Getting court photos...");
            // courtsRes = {dist: courts:[]}
            let getCourtPhotos = courtsRes.courts.map(court => {
                return courtPhotosHelpers.real.getCourtPhotos(court._id);
            })
            
            // Get placeholder photos to pic random photos from for courts with no uploaded pictures
            let getCourtPlaceholderPhotos = courtPhotosHelpers.placeholder.getPlaceholderPhotos();
            
            try{
                Promise.all([...getCourtPhotos, getCourtPlaceholderPhotos])
                    .then(results =>{
                        console.log("Done getting court photos and placeholder photos.");
                        console.log("Packaging it all up...");
                        
                        let placeholderPhotos = results[results.length - 1];
                        let photos = results.slice(0, results.length-1);;
                        
                        // Add court photos when we have some and add placeholders for courts with no photos
                        // We have a 1:1 courts to photos array
                        // So same idx in courts maps to the same idx in photos
                        courtsRes.courts.forEach((court, idx) =>{
                            if (photos[idx].length){
                                court.photos = photos[idx];
                            }
                            else{
                                court.photos = [helpers.getRandomItem(placeholderPhotos)]
                            }
                        })
                        
                        console.log("Done packaging it all up");
                        res.status(200).json(courtsRes);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json(err);
                    })
            }
            catch(err){
                console.log(err);
                res.status(500).json(err);
            }
        })
        .catch(err =>{
            console.log(err);
            res.status(500).json(err);
        })
})

module.exports = Router;