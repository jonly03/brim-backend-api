const courtDetailsModel = require('./details');
const courtPhotosModel = require('./photos'); // real & placeholders (unsplash and others like it)
const courtReviewsModel = require('./reviews');

module.exports = {
    details: courtDetailsModel,
    photos: courtPhotosModel,
    reviews: courtReviewsModel
}