const firebase = require('firebase-admin');

let serviceAccount = require('./serviceAccountKey.json');

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount)
});

module.exports = {
    firebase, 
    firestore: firebase.firestore(),
}