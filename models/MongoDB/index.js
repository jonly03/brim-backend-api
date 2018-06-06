const mongojs = require('mongojs');
const mongoDB = (process.env.MLAB_USERNAME && process.env.MLAB_USERNAME && process.env.MLAB_PASSWORD && process.env.MLAB_DB_URL) ? mongojs(`mongodb://${process.env.MLAB_USERNAME}:${process.env.MLAB_PASSWORD}@${process.env.MLAB_DB_URL}`) : mongojs('hoopsgram');

mongoDB.on('connect', () => {
	console.log('db connected');
})

module.exports = mongoDB;