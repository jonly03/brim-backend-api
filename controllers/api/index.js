let express = require('express');


let courtHelpers = require('../../models/court/details/helpers');
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
        .then(courts => res.status(200).json(courts))
        .catch(err => {
            res.status(500).json(err);
            console.log(err)
        })
})

module.exports = Router;