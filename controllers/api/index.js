const express = require('express');

const helpers = require('./helpers');
const courtHelpers = require('../../models/court/details/helpers');
const courtPhotosHelpers = require('../../models/court/photos');
// const db = require('../../models/Firestore').firestore;

const Router = express.Router();

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

Router.get('/courts/latLng/:lat/:lng', function (req, res) {
    let { lat, lng } = req.params;

    // Only get courts from our DB
    courtHelpers.getNearbyCourts({ lat: Number(lat), lng: Number(lng) })
        .then(courtsRes => {
            console.log("Done getting nearby courts.");
            console.log("Getting court photos...");
            // courtsRes = {dist: courts:[]}
            let getCourtPhotos = courtsRes.courts.map(court => {
                return courtPhotosHelpers.real.getCourtPhotos(court._id);
            })

            // Get placeholder photos to pic random photos from for courts with no uploaded pictures
            let getCourtPlaceholderPhotos = courtPhotosHelpers.placeholder.getPlaceholderPhotos();

            try {
                Promise.all([...getCourtPhotos, getCourtPlaceholderPhotos])
                    .then(results => {
                        console.log("Done getting court photos and placeholder photos.");
                        console.log("Packaging it all up...");

                        let placeholderPhotos = results[results.length - 1];
                        let photos = results.slice(0, results.length - 1);;

                        // Add court photos when we have some and add placeholders for courts with no photos
                        // We have a 1:1 courts to photos array
                        // So same idx in courts maps to the same idx in photos
                        courtsRes.courts.forEach((court, idx) => {
                            if (photos[idx].length) {
                                court.photos = photos[idx];
                            }
                            else {
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
            catch (err) {
                console.log(err);
                res.status(500).json(err);
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json(err);
        })
})

// ballUp+ API Routes
Router.get('/plus/courts', (req, res) => {
    // Gets all courts with their photos
    courtHelpers.getAllCourts()
        .then(courtsRes => {

            let getCourtPhotos = courtsRes.map(court => {
                return courtPhotosHelpers.real.getCourtPhotos(court._id);
            })

            try {
                Promise.all(getCourtPhotos)
                    .then(photos => {
                        let courts = {};
                        courts.total = courtsRes.length;
                        courts.photoCount = 0;

                        courtsRes.forEach((court, idx) => {
                            if (photos[idx].length) {
                                court.photos = photos[idx];
                                courts.photoCount++;
                            } else {
                                court.photos = [];
                            }
                        })

                        // Package them by city
                        let courtsByCityObj = {};
                        courtsRes.map(court => {
                            if (!courtsByCityObj[court.city]) {
                                courtsByCityObj[court.city] = [court];
                            } else {
                                courtsByCityObj[court.city].push(court);
                            }
                        })
                        courts.cityCount = Object.keys(courtsByCityObj).length;

                        let courtsByCityArr = []
                        for (const city in courtsByCityObj) {
                            courtsByCityArr.push({ [city]: courtsByCityObj[city] })
                            courtsByCityArr.sort((court1, court2) => {
                                return Object.keys(court1)[0] > Object.keys(court2)[0];
                            })
                        }

                        let courtsBycountryCountObj = {};
                        courtsRes.map(court => {
                            if (!courtsBycountryCountObj[court.country]) {
                                courtsBycountryCountObj[court.country] = 0;
                            } else {
                                courtsBycountryCountObj[court.country]++;
                            }
                        })
                        courts.countryCount = Object.keys(courtsBycountryCountObj).length;
                        courts.courtsByCity = courtsByCityArr;

                        return res.status(200).json(courts);
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json(err);
                    })
            }
            catch (err) {
                console.log(err);
                res.status(500).json(err);
            }
        })
        .catch(err => {
            console.log("Failed to get all courts");
            return res.send({});
        })
})

module.exports = Router;