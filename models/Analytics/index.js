const CourtVisits = require("./db").collection("court_visits");
// const ChatSessionAnalytics = require("./db").collection("chatsession");
// const OnlineAnalytics = require("./db").collection("online");

/*
CourtVisits is a collection of court visit documents
A court visit document is going to have the following fields:
- courtId
- latLng
- courtName
- timestamp 
- day (Monday-Friday)
- hour (0000 - 2300)
- timeofDay (Morning, Noon, Afternoon, Night)
- weather (Sunny, Rainy, ...)
- tempFahrenheit: temperature in Fahrenheit (if available)
- tempMinFahrenheit: min temperature in Fahrenheit (if available)
- tempMaxFahrenheit: max temperature in Fahrenheit (if available)
- humidityPercentage: (if available)
- windSpeedMilesPerHour (if available)
- checkinsCurrentCount: total number of people at the court at this checkin
*/

const saveCourtVisit = ({ courtVisit }) => {
  return new Promise((resolve, reject) => {
    CourtVisits.save(courtVisit, error => {
      if (error) {
        console.log("Failed to save court visit document with error: ", error);
        return reject(error);
      }

      return resolve();
    });
  });
};

const getCourtVisitsByCourtId = ({ courtId }) => {
  return new Promise((resolve, reject) => {
    CourtVisits.find({ courtId }, (error, docs) => {
      if (error) {
        console.log("Failed to save court visit document with error: ", error);
        return reject(error);
      }

      if (!docs || docs.length <= 0) {
        console.log("No court visit record exists for courtId: ", courtId);
        return resolve({
          error: "No court visit record exists for this courtId"
        });
      }

      // Return it as is for now (down the road we might need to sort them by timestamp)
      return resolve({ courtsVisits: docs });
    });
  });
};

module.exports = {
  saveCourtVisit,
  getCourtVisitsByCourtId
};

/* TODO
ChatSessionAnalytics is a collection of chatsession analytics documents
2. I am going to give each court a field called chatStats which will have a list of chat sessions. A chat session starts when 1 person sends a message and ends when no one is online near that court. So a chatStats record will have time and weather the first message was sent, time and weather the last message was sent, and the total count of messages that were sent during that session

3. I am going to keep a record of the  total number of people who are online near a court at the same time. So an onlineUsersStats record will have time and weather one person is online, time and weather the last person left, minimum and max number of people who were online during that time frame
*/
