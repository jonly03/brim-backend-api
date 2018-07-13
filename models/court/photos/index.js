const Cheerio = require('cheerio');
const helpers = require('./helpers');

// const firestoreRef = require('../../Firestore').firestore;
const mongoDbRef = require('../../MongoDB');

// const courtsCollectionFirestoreRef = require('../details').firestoreCollectionRef;
const courtsCollectionMongoDbRef = require('../details').mongoDbCollectionRef;

// const realPhotosFirestoreCollectionRef = firestoreRef.collection('court-photos');
const realPhotosMongoDbCollectionRef = mongoDbRef.collection('court-photos');

// const placeholderPhotosFirestoreCollectionRef = firestoreRef.collection('unsplash-placeholder-photos');
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
		    // placeholderPhotosFirestoreCollectionRef.doc(_id).set(details)
		    //     .then(() => resolve())
		    //     .catch(err =>{
		    //         console.log(err);
		    //         return reject(err);
		    //     })
		    placeholderPhotosMongoDbCollectionRef.update({_id}, details, {upsert: true}, function(err){
		        if (err){
		            console.log(err);
		            return reject(err);
		        }
		        resolve();
		    });
		}
		else{
		    // realPhotosFirestoreCollectionRef.doc(public_id).set(details).then(() =>{
    		// 	// update the court (details.court_id) with new photos_total
    		// 	courtsCollectionFirestoreRef.doc(details.court_id).get().then(doc =>{
    		// 		if (doc.exists){
    		// 			let {photos_total} = doc.data();
    		// 			photos_total += 1;
    
    		// 			doc.ref.update({photos_total}).then(() =>{
    		// 				console.log(`Done updating the total count of photos for courts/${details.court_id}`)
    		// 			})
    
    		// 		}else{
    		// 			console.log(`Firestore courts/${details.court_id} doesn't exist`);
    		// 		}
    		// 	})
    		// });
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

function getPlaceholderPhotos(){
	return new Promise((resolve, reject) =>{
		// placeholderPhotosFirestoreCollectionRef.get().then(querySnap =>{
		// 	if (querySnap.empty){
		// 		console.log("empty placeholders");
		// 	}
			
		// 	let placeholdersDocs = querySnap.docs;
			
		// 	let placeholderPhotos = placeholdersDocs.map(doc =>{
		// 		return doc.data()
		// 	})
			
		// 	resolve(placeholderPhotos);
		// })
		// .catch(err => {
		// 	console.log(err);
		// 	reject(err);
		// })

		console.log('Getting all placeholder photos...')
		placeholderPhotosMongoDbCollectionRef.find({}, (err, doc)=>{
			if (err){
				console.log("Failed to access placeholder photos");
				return reject(err);
			}
			if (!doc || !doc.length) {
				console.log('No placeholder photos found. Returning empty array');
				return resolve([])
			}

			console.log('Done getting all placeholder photos');
			return resolve(doc)
		})
	})
}

function getCourtPhotos(courtId){
	return new Promise((resolve, reject) =>{
		// realPhotosFirestoreCollectionRef.where('court_id', '==', courtId).get()
		// 	.then(querySnap => {
		// 		if (querySnap.empty) resolve([]) // No photos for this court
				
		// 		let photosDocs = querySnap.docs;
			
		// 		let courtPhotos = photosDocs.map(doc =>{
		// 			return doc.data()
		// 		})
				
		// 		resolve(courtPhotos);
		// 	})
		// 	.catch(err => {
		// 		console.log(err);
		// 		reject(err);
		// 	})
		
		console.log(`Getting photos for courtId/${courtId}...`);
		realPhotosMongoDbCollectionRef.find({court_id: courtId}, (err, doc) =>{
			if (err){
				console.log(`Failed to get photos for courtId/${courtId}`);
				return reject(err);
			}
			
			if (!doc || !doc.length){
				console.log(`No photos found for courtId/${courtId}. Returning an empty array`);
				return resolve([]);
			}

			resolve(doc)
		})
	})
}

module.exports = {
    real:{
    	// firestoreCollectionRef: realPhotosFirestoreCollectionRef,
    	mongoDbCollectionRef: realPhotosMongoDbCollectionRef,
    	getCourtPhotos
    },
    placeholder:{
    	// firestoreCollectionRef: placeholderPhotosFirestoreCollectionRef,
		mongoDbCollectionRef: placeholderPhotosMongoDbCollectionRef,
		getPlaceholderPhotos
    },
    downloadAndSave: saveCourtsPhotos // download and save real and placeholders from the cloud
}