const {firebase, firestore} = require('../../Firestore')
const mongoDB = require('../../MongoDB');
const NodeGeocoder = require('node-geocoder');
var geodist = require('geodist');


// node-geocoder config with google places api key
const nodeGeocoderOptions = {
	provider: 'google',
	apiKey: process.env.PLACES_API_KEY
}
const geocoder = NodeGeocoder(nodeGeocoderOptions);

const firestoreCourtsRef = firestore.collection('courts');
const mongoDBCourtsRef = mongoDB.collection('courts');
const firestoreCheckinsRef = firestore.collection('checkins');
const mongoDBCheckinsRef = mongoDB.collection('checkins');

function getLocDetails(coords){
	return new Promise((resolve, reject) =>{
		geocoder.reverse({lat: coords.lat, lon: coords.lng})
			.then(res => {
				const locDetails = res[0];
				const address = locDetails.formattedAddress;

				const addressParts = address.split(',');

				// Get 
				// country (last idx)
				// state postalCode/zipcode (lastIdx-1)
				// city (lastIdx-2)
				// street (lastIdx-3)
				//from formatted address
				const lastIdx = addressParts.length -1
				
				const country = addressParts[lastIdx].trim();

				const state = addressParts[lastIdx - 1].trim().split(' ')[0];
				
				const postalCode = addressParts[lastIdx - 1].trim().split(' ')[1];

				const city = addressParts[lastIdx - 2].trim();
				
				const street = addressParts[lastIdx - 3].trim();
				
				const geoPoint = new firebase.firestore.GeoPoint(coords.lat, coords.lng);
				
				resolve({...coords, geoPoint, street, city, state, postalCode, country, address});
			})
			.catch(err => {
				reject(err)
			})
	})
}

function getBoundingBox(point, distInMiles){
    // 1deg of Lat ~= 69mi
    // 1deg of Lng ~= 55.2428
    let oneLatDegInMiles = 1/69;
    let onLngDegInMiles = 1/55.2428;
    
    let {lat, lng} = point;
    
    let latOffset = oneLatDegInMiles * distInMiles;
    let lngOffset = onLngDegInMiles * distInMiles;

    let lowerLat = lat - latOffset;
    let lowerLng = lng - lngOffset;

    let greaterLat = lat + latOffset;
    let greaterLng = lng + lngOffset;
    
    return {
        min:{
            lat: lowerLat,
            lng:lowerLng
        },
        max:{
            lat: greaterLat,
            lng: greaterLng
        }
    }
}

function isWithin(point, boundingBox){
    return point.lat > boundingBox.min.lat &&
            point.lat < boundingBox.max.lat &&
            point.lng > boundingBox.min.lng &&
            point.lng < boundingBox.max.lng;
}

async function tryGettingNearbyCourtsFirestore(latLng){
    // Try 15 mi radius first, if no courts keep incrementing
    // Give up after 30 mi radius
    return new Promise(async (resolve, reject) =>{
		let mileRadiusesToTry = [15, 20, 25, 30];
		let idx = 0;
		let courts = [];
		do{
			try{
				console.log(`Trying getting courts near ${mileRadiusesToTry[idx]} miles...`);
				courts = await getCourtsNearByFirestore(latLng, mileRadiusesToTry[idx++]);
			} catch(err){
				reject(err);
			}
		}
		while (courts.length === 0 && idx < mileRadiusesToTry.length)
		
		resolve({dist: mileRadiusesToTry[idx-1], courts});
    })
}

async function tryGettingNearbyCourtsMongoDB(latLng){
    // Try 15 mi radius first, if no courts keep incrementing
    // Give up after 30 mi radius
    return new Promise(async (resolve, reject) =>{
		let mileRadiusesToTry = [15, 20, 25, 30];
		let idx = 0;
		let courts = [];
		do{
			try{
				console.log(`Trying getting courts near ${mileRadiusesToTry[idx]} miles...`);
				courts = await getCourtsNearByMongoDB(latLng, mileRadiusesToTry[idx++]);
			} catch(err){
				reject(err);
			}
		}
		while (courts.length === 0 && idx < mileRadiusesToTry.length)
		
		resolve({dist: mileRadiusesToTry[idx-1], courts});
    })
}

function getCourtsNearByMongoDB(latLng, radius) {
	// TODO: Handle pagination
	// Get data in batches
    return new Promise((resolve, reject) => {
        let boundingBox = getBoundingBox(latLng, radius);
    	
    	mongoDBCourtsRef.find({
    	    lat: {$lt: boundingBox.max.lat}, 
    	    lat: {$gt: boundingBox.min.lat}
    	}, (err, courts) => {
    	    if (err){
    	        console.log("Error getting nearby courts: ", err);
    	        reject(err)
    	    }
    	   // console.log(doc);
    	   courts = courts.filter(court =>{
                const {lat: courtLat, lng: courtLng} = court;
                
                // results are only filtered by latitude, filter them again
                return isWithin({lat:courtLat, lng: courtLng}, boundingBox)
            });
    	    resolve(sortByNearestMongoDB(latLng, courts));
    	})
    })
}

function getCourtsNearByFirestore(latLng, radius) {
	// TODO: Handle pagination
	// Get data in batches
    return new Promise((resolve, reject) => {
        let boundingBox = getBoundingBox(latLng, radius);
    	
        let lesserGeopoint = new firebase.firestore.GeoPoint(boundingBox.min.lat, boundingBox.min.lng);
        let greaterGeopoint = new firebase.firestore.GeoPoint(boundingBox.max.lat, boundingBox.max.lng)
    
        let query = firestoreCourtsRef
            .where("geoPoint", ">", lesserGeopoint)
            .where("geoPoint", "<", greaterGeopoint)
            .get()
            .then((querySnap) => {
                
                let courts = querySnap.docs;
                courts = courts.filter(doc =>{
                    let court = doc.data();
                    const {latitude: courtLat, longitude: courtLng} = court.geoPoint;
                    
                    // results are only filtered by latitude, filter them again
                    return isWithin({lat:courtLat, lng: courtLng}, boundingBox)
                });
                
                resolve(sortByNearestFirestore(latLng, courts));
            })
    
            .catch(function(err) {
                console.log("Error getting nearby courts: ", err);
                reject(err);
            });
    })
}

function getCourtsByCity(){
	// TODO: eventually give people a way to query courts by city
}

function getCourtsByZipocode(){
	// TODO: eventually give people a way to query courts by zipcode
}

function getCourtsByState(){
	// TODO: eventually give people a way to query courts by state
}

function getCourtsByCountry(){
	// TODO: eventually give people a way to query courts by country
}

function sortByNearestFirestore(latLng, courtsList){
	let courts = courtsList.map(court => {
        let tempCourt = court.data();
        
        const {latitude: courtLat, longitude: courtLng} = tempCourt.geoPoint;
        
        // Calculate distance from current location and add dist property to each court
        var dist = geodist({lat: latLng.lat, lon: latLng.lng}, 
                        {lat: courtLat, lon: courtLng}, 
                        {exact: true, unit: 'mi'}).toFixed(1);
        tempCourt.dist = Number(dist);
        return tempCourt;
        
    });
                
    return courts.sort((court1, court2) => court1.dist - court2.dist);
}

function sortByNearestMongoDB(latLng, courtsList){
	let courts = courtsList.map(court => {
        // let tempCourt = court.data();
        
        const {lat: courtLat, lng: courtLng} = court;
        
        // Calculate distance from current location and add dist property to each court
        var dist = geodist({lat: latLng.lat, lon: latLng.lng}, 
                        {lat: courtLat, lon: courtLng}, 
                        {exact: true, unit: 'mi'}).toFixed(1);
        court.dist = Number(dist);
        return court;
        
    });
                
    return courts.sort((court1, court2) => court1.dist - court2.dist);
}

function checkinAnonymous(clientId, courtId){
    return new Promise((resolve, reject) => {
        // Find the court and increase the current and total checkins
    //     firestoreCourtsRef.doc(courtId).get().then(doc =>{
    // 		if (doc.exists){
    // 			let {checkins_current, checkins_total} = doc.data();
    // 			checkins_current += 1;
    // 			checkins_total += 1;
    
    // 			doc.ref.update({checkins_current, checkins_total}).then(() =>{
    // 				console.log(`Done updating the current & total checkins for courts/${courtId}`);
    // 				resolve({current:checkins_current, total:checkins_total});
    // 			})
    
    // 		}else{
    // 			console.log(`Firestore courts/${courtId} doesn't exist`);
    // 			reject();
    // 		}
    // 	})
    	console.log("In chekinAnonymous function...");
    	console.log(`clientId/${clientId} courtId/${courtId}`);
    	// Add the checkin record for the court then increment checkins for court
    	mongoDBCheckinsRef.update(
	        {court_id: courtId}, 
	        {$addToSet: {clients_ids: clientId}}, 
	        {upsert: true, new: true}, 
    	    (err, doc) =>{
    	        if (err){
    	            console.log(err);
    	            reject(err);
    	        }
    	        
    	        console.log('new document after update...')
    	        console.log(doc)
    	        console.log('increment court checkin count');
    	        // Increment checkins for court
    	        mongoDBCourtsRef.findAndModify(
        			{_id: courtId},
        			{$inc:{checkins_current: 1, checkins_total: 1}},
        			{new:    true}, 
            		(err, doc) =>{
            			if (err) {
            			    console.log(err);
            			    return reject(err);
            			}
            			
                        console.log('new doc');
                        console.log(doc);
            			resolve({current: doc.checkins_current, total:doc.checkins_total});
            		}
            	)
    	    }
    	)
    });
}

function checkoutAnonymous(clientId, courtId){
    return new Promise((resolve, reject) => {
        // Find the court and decrease the current checkins
    //     firestoreCourtsRef.doc(courtId).get().then(doc =>{
    // 		if (doc.exists){
    // 			let {checkins_current} = doc.data();
    // 			if (checkins_current > 0){
    // 			    // Make sure to never have a negative checkin current count
    //     			checkins_current -= 1;
        
    //     			doc.ref.update({checkins_current}).then(() =>{
    //     				console.log(`Done checking out of the court/${courtId}`);
    //     				resolve({current: checkins_current});
    //     			})
    // 			}
    
    // 		}else{
    // 			console.log(`Firestore courts/${courtId} doesn't exist`);
    // 			reject();
    // 		}
    // 	})
    	
    	// Remove checkin record for court then decrement checkins for court
    	mongoDBCheckinsRef.update({
        	    query:  {court_id: courtId},
        	    update: {$pull:{clients_ids: clientId}},
        	    new:    true
    	    },
    	    (err, doc) => {
    	        if (err){
    	            console.log(err);
    	            reject(err);
    	        }
    	        
    	        // remove the court record if no one is left checked in
    	        // No need to wait for this operation
    	        if (doc.clients_ids && !doc.clients_ids.length){
    	            mongoDBCheckinsRef.deleteOne({court_id: courtId}, (err) => {
    	                if (err){
            	            console.log(err);
            	           // reject(err);
            	        }
    	            })
    	        }
    	        
    	        // Decrement current checkins for court
    	        mongoDBCourtsRef.findAndModify({
            			query:  {_id: courtId, checkins_current: {$gt: 0}},
            			update: {$inc:{checkins_current: -1}},
            			new:    true
        		    }, 
            		(err, doc) =>{
            			if (err) {
            			    console.log(err);
            			    return reject(err);
            			}
                        
                        if (doc.checkins_current){
            			    resolve({current: doc.checkins_current});
                        } else{
                            resolve({current: 0});
                        }
            		}
            	)
    	    }
    	)
    });
}

function checkoutAnonymousOnDisconnect(clientId){
    return new Promise((resolve, reject) => {
    	// Before getting rid of checkin record, get court id so we can decrement checkin count
    	// Client should have been only checked into one court
    	mongoDBCheckinsRef.findOne({clients_ids: clientId}, (err, doc) =>{
    	    if (err){
    	        console.log(err);
    	        reject(err)
    	    }
    	    
    	    // Every disconnected client might not be checked into any courts
    	    if (doc === null || !doc) return resolve()
    	    
    	    const {courtId} = doc;
    	    
    	    mongoDBCheckinsRef.update(
        	    {clients_ids: clientId},
        	    {$pull:{clients_ids: clientId}},
        	    {new:true},
        	    (err, doc) => {
        	        if (err){
        	            console.log(err);
        	            reject(err);
        	        }
        	        
        	        // remove the court record if no one is left checked in
    	            // No need to wait for this operation
        	        if (doc.clients_ids && !doc.clients_ids.length){
        	            mongoDBCheckinsRef.deleteOne({court_id: courtId}, (err) => {
        	                if (err){
                	            console.log(err);
                	           // reject(err);
                	        }
        	            })
        	        }
        	        
        	        // Decrement current checkins for court
        	        mongoDBCourtsRef.findAndModify({
                			query:  {_id: courtId, checkins_current: {$gt: 0}},
                			update: {$inc:{checkins_current: -1}},
                			new:    true
            		    }, 
                		(err, doc) =>{
                			if (err) {
                			    console.log(err);
                			    return reject(err);
                			}
                            
                            if (doc.checkins_current){
                			    resolve({courtId: doc._id, current: doc.checkins_current});
                            } else{
                                resolve({courtId: doc._id, current: 0});
                            }
                		}
                	)
        	    }
        	)
    	    
    	})
    	
    });
}

module.exports = {
    getLocDetails,
    tryGettingNearbyCourtsFirestore,
    tryGettingNearbyCourtsMongoDB,
    checkinAnonymous,
    checkoutAnonymous,
    checkoutAnonymousOnDisconnect
}