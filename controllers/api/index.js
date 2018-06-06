let express = require('express');


let Helpers = require('../helpers');
let db = require('../../models/Firestore');

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
    Helpers.getLatLngAddress(lat, lng).then(address => {
        return CourtsDB.findCourtsByCity(address.city) // Query Firestore by city
    })
    .then(courtsQrySnap =>{
        if (courtsQrySnap.empty){
            // Save info about the city the request came from to keep track of interest
            // Send back that we have no courts in that city
            let latLng = [];
            latLng.push(lat);
            latLng.push(lng);
            return Helpers.getCourts('latLng', latLng)
        }else{
            //res.status(200).json(courts);
            console.log(courtsQrySnap);
        }
    })
    .then(courts => {
        res.status(200).json(courts);
        
        CourtsDB.save(courts).then(res => {
            // console.log(res.length);
            // console.log(res);
        })
    })
    .catch(err => {
        //res.status(500).json(err);
        console.log(err)
    })
})

module.exports = Router;