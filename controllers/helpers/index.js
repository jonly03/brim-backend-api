// const NodeGeocoder = require('node-geocoder');
const axios = require('axios');
const cloudinary = require('cloudinary');
// const Nightmare = require('nightmare');
let uniqid = require('uniqid');

// node-geocoder config with google places api key
// const nodeGeocoderOptions = {
// 	provider: 'google',
// 	apiKey: process.env.PLACES_API_KEY
// }
// const geocoder = NodeGeocoder(nodeGeocoderOptions);

// cloudinary configuration
const cloudinaryConfig = {
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
}
cloudinary.config(cloudinaryConfig);

// nightmare.js configuration
// const nightmare = Nightmare({ show: true, height: 10000 });
// let containerToScroll = process.env.CONSOLE_SCROLLED_CONTAINER;

const SEARCH_TYPE = 'park';
const SEARCH_KEYWORD = 'basketball court';
const PLACES_API = 'https://maps.googleapis.com/maps/api/place';
const PLACES_API_NEARBY_SEARCH_ROUTE = `${PLACES_API}/nearbysearch/json?`;
const PLACES_API_PHOTOS_SEARCH_ROUTE = `${PLACES_API}/photo?`;
const PLACES_API_KEY_PARAM = `&key=${process.env.PLACES_API_KEY}`;
const UNSPLASH_TOTAL_PAGES = 11;

let db = require('../../models');

function getNearbyCourtsDetails(coords){
	const searchUrl = `${PLACES_API_NEARBY_SEARCH_ROUTE}location=${coords.lat},${coords.lng}&rankby=distance&type=${SEARCH_TYPE}&keyword=${SEARCH_KEYWORD}${PLACES_API_KEY_PARAM}`;

	return axios.get(searchUrl);
}

// function getLocDetails(coords){
// 	return new Promise((resolve, reject) =>{
// 		geocoder.reverse({lat: coords.lat, lon: coords.lng})
// 			.then(res => {
// 				const locDetails = res[0];
// 				const address = locDetails.formattedAddress;

// 				const addressParts = address.split(',');

// 				// Get 
// 				// country (last idx)
// 				// state postalCode/zipcode (lastIdx-1)
// 				// city (lastIdx-2)
// 				// street (lastIdx-3)
// 				//from formatted address
// 				const lastIdx = addressParts.length -1
				
// 				const country = addressParts[lastIdx].trim();

// 				const state = addressParts[lastIdx - 1].trim().split(' ')[0];
				
// 				const postalCode = addressParts[lastIdx - 1].trim().split(' ')[1];

// 				const city = addressParts[lastIdx - 2].trim();
				
// 				const street = addressParts[lastIdx - 3].trim();
				
// 				resolve({...coords, street, city, state, postalCode, country, address});
// 			})
// 			.catch(err => {
// 				reject(err)
// 			})
// 	})
// }

function uploadCourtPhotos(courtId, courtName, photos){
	return new Promise((resolve, reject) =>{
		// Build places api url for each photo
		// Use url to upload the photo to Cloudinary for hosting
		// Send back their Cloudinary info object
		let uploadPhotos = photos.map(photo => {
			const {height, width, photo_reference} = photo;

			const photoPlacesAPIUrl = `${PLACES_API_PHOTOS_SEARCH_ROUTE}maxwidth=${width}&maxheight=${height}&photoreference=${photo_reference}${PLACES_API_KEY_PARAM}`;

			return uploadCourtPhoto(photoPlacesAPIUrl, courtId, courtName);
		})

		try{
			Promise.all(uploadPhotos)
				.then(() => resolve())
				.catch(err => reject(err))
		} catch(err){
			reject(err);
		}	
	})
}

function uploadCourtPhoto(url, court_id, courtName){
	
	return new Promise((resolve, reject) => {
		const public_id = `${courtName.split(' ').join('_')}__${court_id}__${uniqid()}`;
		const options = {
			public_id,
			overwrite: true
		}

		cloudinary.uploader.upload(url, function (result){
			console.log('Result from cloudinary...')
			if (!result){
				console.log('Failed to upload photo');
				reject('Failed to upload photo');
			}

			resolve();
		}, options);
	})
}

function uploadPlaceholderPhotos(){
  return new Promise((resolve, reject) => {
    const uploadUnsplashPhotos = []
    getUnsplashPhotos()
      .then(unsplashPhotos =>{
          unsplashPhotos.map(unsplashPhoto =>{
            let {url, id, username, photographer} = unsplashPhoto;
            
            uploadUnsplashPhotos.push(
              uploadPlaceholderPhoto(url, id, username, photographer)
            )
          })
      })
      .catch(err => {
        console.log(err);
        return reject(err);
      })
      
    try{
      Promise.all(uploadUnsplashPhotos).then(() => {
        console.log("Done uploading placeholders");
        resolve()
        
      });
    } catch(err){
      console.log(err);
      reject(err)
    }
  })
}

function uploadPlaceholderPhoto(url, id, photographerUsername, photograherName){
  return new Promise((resolve, reject) => {
		const public_id = `Unsplash__${id}__${photographerUsername}__${photograherName}`;
		const options = {
			public_id,
			overwrite: true
		}

		cloudinary.uploader.upload(url, function (result){
			console.log('Successfully saved photo to cloudinary...')
			if (!result){
				console.log('Failed to upload photo');
				reject('Failed to upload photo');
			}

			resolve();
		}, options);
	})
}

// function parseCourtPhotos($){
//     let public_ids = $('article').find('div.textbox');
//     let sizes = $('article').find("div[data-test='asset-dimensions']");
//     console.log(sizes.length);

//     let images = [];

//     for (let i=0; i < sizes.length; i++){
//       let public_id = $(public_ids[i]).attr('data-balloon');

//       if (public_id){
//         let wxh = $(sizes[i]).text();
//         let width = wxh.split(' ')[0].trim();
//         let height = wxh.split(' ')[2].trim();
        
//         let header = public_id.split('__')[0];
        
//         if (header === 'Unsplash'){
//           let _id = public_id.split('__')[1];
//           let username = public_id.split('__')[2];
//           let photographer = public_id.split('__')[3];
          
//           images.push({
//             url_root: process.env.COURT_PHOTOS_HOST_URL,
//             public_id,
//             _id,
//             username,
//             photographer,
//             width,
//             height
//           })
//         } else{
//           let court_name = public_id.split('__')[0];
//           let court_id = public_id.split('__')[1].split('.')[0];
          
//           images.push({
//             url_root: process.env.COURT_PHOTOS_HOST_URL,
//             public_id,
//             court_name,
//             court_id,
//             width,
//             height,
//             likes: 0
//           })
//         }
//       }
//     }

//     return images;
// }

function getUnsplashPhotos(){
  return new Promise((resolve, reject) =>{
    const getUnsplashPlaceholders = [];
    // Get 11 pages of unsplash basketball photos
    // Total of 319 pictures
    for (let i=0; i <  UNSPLASH_TOTAL_PAGES; i++){
      getUnsplashPlaceholders.push(
        getUnsplashPhotosByPage(i)
      )
    }
    
    try{
      Promise.all(getUnsplashPlaceholders)
        .then((resultsArray) =>{
          let unsplashPhotos = [];
          
          resultsArray.map(res =>{
            res.data.results.map(photo =>{
              let {id, urls:{raw : url}, user:{username, name: photographer}} = photo;
              unsplashPhotos.push({id, url, username,photographer})
            })
            return resolve(unsplashPhotos);
          })
        })
        .catch(err => {
          console.log(err);
          return reject(err);
        })
    } catch(err){
      console.log(err);
      return reject(err)
    }
  })
}

function getUnsplashPhotosByPage(pageNum){
   
  // new Promise((resolve, reject) =>{
  return  axios({
      method: 'GET',
      url:`https://api.unsplash.com/search/photos?client_id=${process.env.UNSPLASH_CLIENT_ID}&page=${pageNum}&orientation=landscape&query=basketball court`
    })
    // .then(res =>{
    //   let unsplashPhotos = res.data.results.map(photo =>{
    //     let {id, urls:{raw : url}, user:{username, name: photographer}} = photo;
    //     return {
    //       id,
    //       url,
    //       username,
    //       photographer
    //     }
    //   })
      
    //   resolve(unsplashPhotos);
    // })
    // .catch(err =>{
    //   reject(err)
    // })
  // })
}

function getCourtPhotosDetails(){
	// Get courts from cloud
	// Every court's public_id is formatted like this
	// courtName__courtId (for now, moving forward when users upload court photos, add the userId)
	// For now just get everything but going forward (when users upload court photos, search for recent uploads)
	return nightmare
	  .goto(process.env.CONSOLE)
	  .wait(process.env.CONSOLE_EMAIL_SELECTOR)
	  .type(process.env.CONSOLE_EMAIL_SELECTOR, process.env.CONSOLE_EMAIL)
	  .type(process.env.CONSOLE_PASSWORD_SELECTOR, process.env.CONSOLE_PASSWORD)
	  .click(process.env.CONSOLE_SUBMIT_SELECTOR)
	  .wait(process.env.CONSOLE_COURT_PHOTOS_CONTAINER_SELECTOR)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate((containerToScroll) => {
	    document.querySelector(containerToScroll).scrollTop = 1000000
	  }, containerToScroll)
	  .wait(2000)
	  .evaluate(() => document.body.innerHTML)
}

function getOneCourtDetails(court){
  // get id, name, location, photos, and reviews
  // specify that these courts were from google places (type='googleplaces' && userId='')
  // initialize checkins to 0
  return new Promise((resolve, reject) =>{
    let { id: courtId} = court;
    
    // TODO: Once we have enough photos, reviews, and user submitted data get rid of these
    let promises = [];
    promises.push(getCourtPhotoPlaceHolders());
    // promises.push(getCourtExtraDetails(courtId, 'photos'));
    // promises.push(getCourtExtraDetails(courtId, 'tips'));
    
    try{
      Promise.all(promises).then(res =>{
        let [ photoPlaceHolders, photos, reviews ] = res;
        
        // If no photos available for court, give it a place holder
        if (!photos.length){
          const randIdx = Math.floor(Math.random() * photoPlaceHolders.length);
          photos = [{placeHolder: photoPlaceHolders[randIdx]}];
        }
        
        let newCourt = {};
        newCourt.id= court.id;
        newCourt.info = {};
        newCourt.info.name= court.name,
        // newCourt.info.location = getCourtLocation(court);
        newCourt.checkins = {
          total: 0,
          current: 0
        }
        newCourt.photos = photos;
        newCourt.reviews = reviews ? reviews : [];
        
        resolve(newCourt);
      })
    }catch(err){
      reject(err);
    }
  })
}

function getCourtPhotoPlaceHolders(){
  return new Promise((resolve, reject) =>{
    db.courts.photos.placeholder.firestoreCollectionRef.get().then(qSnap =>{
      if (!qSnap.empty()){
        let courtPhotoPlaceHolders = qSnap.map(court => {
          return court.data;
        })
        
        resolve(courtPhotoPlaceHolders);
      }
      else{
        console.log("No Unsplash photos in Firestore DB")
      }
    }).catch(err => reject(err));
    
    db.courts.photos.placeholder.mongoDbCollectionRef.find((err, courtPhotoPlaceholders) =>{
      if (err) {
        console.log(err);
        return reject(err);
      }
      
      resolve(courtPhotoPlaceholders);
    })
  })
  
}

function getLatLngAddress(lat, lng){
  return new Promise((resolve, reject) => {
    geocoder.reverseGeocode( lat, lng, function ( err, data ) {
      if (err) return reject(err);
      
      const addressParts = data.results[0].formatted_address.split(",");
      console.log(addressParts);
      const street = addressParts[0];
      const city = addressParts[1]
    
      const stateZip = addressParts[2].split(" ");
      const state = stateZip[1];
      const postalCode = stateZip[2];
    
      const country = addressParts[3];
      
      return resolve({street, city, state, postalCode, country});
    });
  })
}

// function destructItemsByDetails(items, details, courtId){
//   return items.map(item => {
//     switch(details){
//       case 'photos':
//         return {
//           id: uniqid(),
//           info:{
//             createdAt: item.createdAt,
//             url: `${item.prefix}original${item.suffix}`,
//             type: 'googleplaces',
//             likes: 0,
//             courtId,
//             userId: '' // for photos added by users
//           }
//         }
//       case 'tips':
//         return {
//           id: uniqid(),
//           info:{
//             createdAt: item.createdAt,
//             text: item.text,
//             type: 'googleplaces',
//             upVotes: 0,
//             downVotes: 0,
//             courtId,
//             userId: '' // for reviews added by users
//           }
//         }
//     }
//   })
// }

module.exports = {
  getNearbyCourtsDetails,
//   getLocDetails,
//   getCourtPhotosDetails,
  uploadCourtPhotos,
  uploadPlaceholderPhotos,
//   parseCourtPhotos,
    // getCourts: function(type, near){
    //     return new Promise((resolve, reject) => {
    //       getCourts(type, near).then(courts => {
    //         return getCourtsDetails(courts);
    //       }).then(courtsDetails => {
              
    //           resolve(courtsDetails);
    //       }).catch(err => {
    //           reject (err);
    //       })
    //     })
    // },
    getLatLngAddress
}