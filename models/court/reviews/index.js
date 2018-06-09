const firestoreRef = require('../../Firestore').firestore;
const mongoDbRef = require('../../MongoDB');

module.exports = {
    firestoreCollectionRef: firestoreRef.collection('court-reviews'),
    mongoDbCollectionRef: mongoDbRef.collection('court-reviews')
}