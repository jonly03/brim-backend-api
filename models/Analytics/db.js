const mongojs = require("mongojs");

// Don't force production environment
// process.env.NODE_ENV = 'production'
const analyticsDB =
  process.env.NODE_ENV === "production"
    ? process.env.MLAB_USERNAME &&
      process.env.MLAB_USERNAME &&
      process.env.MLAB_PASSWORD &&
      process.env.MLAB_DB_URL_ANALYTICS
      ? mongojs(
          `mongodb://${process.env.MLAB_USERNAME}:${
            process.env.MLAB_PASSWORD
          }@${process.env.MLAB_DB_URL_ANALYTICS}`
        )
      : mongojs("analytics")
    : mongojs("localhost:27017/analytics");

// ONLY UNCOMMENT FOR ADMIN SEEDING
// const analyticsDB = (process.env.MLAB_USERNAME && process.env.MLAB_USERNAME && process.env.MLAB_PASSWORD && MLAB_DB_URL_ANALYTICS) ? mongojs(`mongodb://${process.env.MLAB_USERNAME}:${process.env.MLAB_PASSWORD}@${MLAB_DB_URL_ANALYTICS}`) : mongojs('analytics');

analyticsDB.on("connect", () => {
  console.log("db connected");
});

module.exports = analyticsDB;
