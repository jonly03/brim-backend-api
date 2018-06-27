require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const courtHelpers = require('./models/court/details/helpers');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
// TODO only allow requests from hoopsgram.com
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// parse application/json
app.use(bodyParser.json())

const seedRoutes = require('./controllers/seeds');
const apiRoutes = require('./controllers/api')

app.get('/', (req, res) => {
  res.send("Hello");
})

app.use('/seed', seedRoutes);

app.use('/api', apiRoutes);


app.get('/checkin/:courtId', (req, res) =>{
    // Route to for anonymous checkins
    // No need for user to be logged in
    // Just get court's lat, lng and increase their checkins_current & checkins_total
    if (!req.params.courtId){
        console.log("Bad request");
        return res.status(500).json("Bad request: expected a correct court id");
    }
    
    courtHelpers.checkinAnonymous(req.params.courtId)
    .then((checkins) =>{
        // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
        if (client){
        
          // Notify listening clients with checkins count updates
          client.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
          client.broadcast.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
        }
        return res.status(200).send();
    })
    .catch((err) => res.status(500).send() )
    
})

app.get('/checkout/:courtId', (req, res) =>{
    // Route to for anonymous checkouts
    // No need for user to be logged in
    // Just get court's lat, lng and decrease their checkins_current & checkins_total
    if (!req.params.courtId){
        console.log("Bad request");
        return res.status(500).json("Bad request: expected a correct court id");
    }
    
    courtHelpers.checkoutAnonymous(req.params.courtId)
    .then((checkins) =>{
        // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
        if (client){
        
          // Notify listening clients with checkins count updates
          client.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
          client.broadcast.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
        }
        
        return res.status(200).send();
    })
    .catch(() => res.status(500).send());
})

let server = app.listen(PORT, () => {
  console.log(`hoopsgram api server listening on: ${PORT}`)
})

//SOCKET IO
let io = require("socket.io").listen(server);
let client;

io.on('connection', (socket) => {
  client = socket;
})