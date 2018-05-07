let express = require('express');

let Helpers = require('../helpers');
let CourtsDB = require('../../models/Firestore/courts');


let Router = express.Router();

Router.get('/courts/city/:city', function(req, res){
    Helpers.getCourts('city', req.params.city).then(courts => {
        res.status(200).json(courts);
        
        CourtsDB.save(courts).then(res => {
            // console.log(res.length);
            // console.log(res);
        })
    }).catch(err => {
        res.status(500).json(err);
    })
})

Router.get('/courts/latLng/:lat/:lng', function(req, res){
    let latLng = [];
    latLng.push(req.params.lat);
    latLng.push(req.params.lng);
    Helpers.getCourts('latLng', latLng).then(courts => {
        res.status(200).json(courts);
        
        CourtsDB.save(courts).then(res => {
            // console.log(res.length);
            // console.log(res);
        })
    }).catch(err => {
        res.status(500).json(err);
    })
})

module.exports = Router;