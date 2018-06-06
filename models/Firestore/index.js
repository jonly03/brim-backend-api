const firestoreAdmin = require('firebase-admin');

let serviceAccount = require('./serviceAccountKey.json');

firestoreAdmin.initializeApp({
  credential: firestoreAdmin.credential.cert(serviceAccount)
});

module.exports = firestoreAdmin.firestore();