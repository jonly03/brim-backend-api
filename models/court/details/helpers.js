const NodeGeocoder = require('node-geocoder');
// node-geocoder config with google places api key
const nodeGeocoderOptions = {
	provider: 'google',
	apiKey: process.env.PLACES_API_KEY
}
const geocoder = NodeGeocoder(nodeGeocoderOptions);

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
				
				resolve({...coords, street, city, state, postalCode, country, address});
			})
			.catch(err => {
				reject(err)
			})
	})
}

module.exports = {
    getLocDetails
}