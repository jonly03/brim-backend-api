const Cheerio = require('cheerio');
const helpers = require('./helpers');

const firestoreRef = require('../../Firestore');
const mongoDbRef = require('../../MongoDB');

const courtsCollectionFirestoreRef = require('../details').firestoreCollectionRef;
const courtsCollectionMongoDbRef = require('../details').mongoDbCollectionRef;

const realPhotosFirestoreCollectionRef = firestoreRef.collection('court-photos');
const realPhotosMongoDbCollectionRef = mongoDbRef.collection('court-photos');

const placeholderPhotosFirestoreCollectionRef = firestoreRef.collection('unsplash-placeholder-photos');
const placeholderPhotosMongoDbCollectionRef = mongoDbRef.collection('unsplash-placeholder-photos');

function saveCourtsPhotos(){
	return new Promise((resolve, reject) => {
		helpers.getCourtPhotosDetails()
			.then(page =>{
			    let $ = Cheerio.load(page);
			    let photosDetails = helpers.parseCourtPhotos($);
				// let details = [photosDetails[0]]; // try 1 first
				let savePhotos = photosDetails.map(details =>
					saveOneCourtPhoto(details));

				try{
					Promise.all(savePhotos)
						.then(() => resolve())
						.catch(() => reject())

				} catch(err){
					reject(err);
				}
				resolve();
			})	
			.catch(err => reject(err))
	})
}

function saveOneCourtPhoto(details){
	return new Promise((resolve, reject) => {
		let {public_id} = details;
		
		if (details.username){ // placeholders from unsplash have username of photographer
		    let {_id} = details;
		    placeholderPhotosFirestoreCollectionRef.doc(_id).set(details)
		        .then(() => resolve())
		        .catch(err =>{
		            console.log(err);
		            return reject(err);
		        })
		    placeholderPhotosMongoDbCollectionRef.update({_id}, details, {upsert: true}, function(err){
		        if (err){
		            console.log(err);
		            return reject(err);
		        }
		        resolve();
		    });
		}
		else{
		    realPhotosFirestoreCollectionRef.doc(public_id).set(details).then(() =>{
    			// update the court (details.court_id) with new photos_total
    			courtsCollectionFirestoreRef.doc(details.court_id).get().then(doc =>{
    				if (doc.exists){
    					let {photos_total} = doc.data();
    					photos_total += 1;
    
    					doc.ref.update({photos_total}).then(() =>{
    						console.log(`Done updating the total count of photos for courts/${details.court_id}`)
    					})
    
    				}else{
    					console.log(`Firestore courts/${details.court_id} doesn't exist`);
    				}
    			})
    		});
    		realPhotosMongoDbCollectionRef.update({_id:public_id}, {_id: public_id,...details},{upsert: true}, function(err){
    			if (err) {
    			    console.log(err);
    			    return reject(err);
    			}
    
    			// update the court (details.court_id) with new photos_total
    			courtsCollectionMongoDbRef.findAndModify({
    					query:{_id: details.court_id},
    					update:{$inc:{photos_total: 1}}
    				}, 
    				(err, doc) =>{
    					if (err) {
    					    console.log(err);
    					    return reject(err);
    					}
    
    					resolve();
    				}
    			)
    		})
		}
	})
}

module.exports = {
    real:{
    	firestoreCollectionRef: realPhotosFirestoreCollectionRef,
    	mongoDbCollectionRef: realPhotosMongoDbCollectionRef
    },
    placeholder:{
    	firestoreCollectionRef: placeholderPhotosFirestoreCollectionRef,
		mongoDbCollectionRef: placeholderPhotosMongoDbCollectionRef,
    },
    downloadAndSave: saveCourtsPhotos // download and save real and placeholders from the cloud
}