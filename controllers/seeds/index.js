const express = require('express');

const courtsSeedData = require('../../data/seeds');
const helpers = require('../helpers');
const db = require('../../models')


const Router = express.Router();

Router.get('/courts-info', (req, res) =>{
	// Save courts 1 by 1 because otherwise the Google Places APIs are going to trip
	// Another solution can be setInterval for each call but I wanted to see uploaded pictures for each court and get rid of the ones which weren't descriptive of basketball courts anyway.
	const usaCourts = courtsSeedData['USA']
	const cityName = Object.keys(usaCourts)[25];

	//cityNames.forEach(cityName => {
		const cityCoords = [usaCourts[cityName]];
	
		let getNearbyCourtsDetails = cityCoords.map(coords => helpers.getNearbyCourtsDetails(coords))

		try{
			Promise.all(getNearbyCourtsDetails)
				.then(courtsData => {
					if (courtsData.length === 0){
					    console.log('No courts found');
						res.status(404).send();
					}
					
					//console.log(data);
					// Parse courts for info we need to save and make requests for reviews
					let saveCourtsInfo = [];
					// let uploadCourtPhotos = [];
					// let saveCourtsReviews = [];
					for (let i=0; i < courtsData.length; i++){
					    let courts = courtsData[0].data.results;
					    
					    courts.map(courtDetails =>{
                    		let {id, name, geometry:{location}, photos, place_id} = courtDetails;
                    		// console.log(courtDetails);
                    		saveCourtsInfo.push(
                    		    db.courts.details.save(id, name,location)
                    		 );
                    
                    		// if (photos){
                    		// 	uploadCourtPhotos.push(
                    		// 	    helpers.uploadCourtPhotos(id, name, photos)
                    		// 	);
                    		// }
                    
                    		// saveCourtsReviews.push(saveOneCourtReview(place_id))
                    
                    	})
					}
					
					try{
                		Promise.all(saveCourtsInfo, /*uploadCourtPhotos*/).then(() =>{
                		    res.status(200).send();
                		})
                			
                	} catch(err){
                		console.log('Failed to save courts');
                		res.status(500).send();
                	}
				})
				.catch(err =>{
					console.log(err);
					res.status(500).send();
				})
		} catch(err){
			console.log(err)
			res.status(500).send();
		}
		
	// })

})

Router.get('/photos/upload/placeholders', (req, res) =>{
    helpers.uploadPlaceholderPhotos()
        .then(() => res.status(200).send())
        .catch(err =>{
            console.log(err);
            res.status(500).send()
        })
})

Router.get('/photos/download', (req, res) =>{
	db.courts.photos.downloadAndSave()
		.then(() => {
			console.log("Done saving photos to DB")
			res.status(200).send();
		})
		.catch(err => {
			console.log(err);
			res.status(500).send();
		});
})

module.exports = Router;