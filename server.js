require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const courtHelpers = require('./models/court/details/helpers');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
// TODO only allow requests from hoopsgram.com
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://hoopsgram.herokuapp.com");
  // res.header("Access-Control-Allow-Origin", "hoopsgram-react-web-jonly03.c9users.io");
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


app.post('/checkin/:courtId', (req, res) =>{
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

app.post('/checkout/:courtId', (req, res) =>{
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
  
  console.log('clientID/' + client.id + ' connected')
  
  // When connected, keep an ear out for checkin messages and save the connected client
  client.on('checkin', courtId =>{
    console.log('checkin message from clientId/'+ client.id + ' received for courtId/' + courtId);
    console.log('checking client in...')
    courtHelpers.checkinAnonymous(client.id, courtId)
      .then(checkins => {
        console.log('Done checking clientId/' + client.id + ' into courtId/' + courtId);
        console.log('checkedin message sent from server to client');
        client.emit('checkedin', {courtId, checkins});
        client.broadcast.emit('checkedin', {courtId, checkins})
      })
      .catch(err =>{
        console.log('Failed to check user in');
        console.log(err);
        client.emit('checkin-failed', {error: 'Failed to check user in'})
      })
  })
  
  // Keep an ear out for when clients disconnect so we can check them out
  client.on('checkout', courtId =>{ // Check clients out when we receive the checkout message
    console.log('checkout message from clientId/'+ client.id + ' received for courtId/' + courtId);
    console.log('checking client out...')
    courtHelpers.checkoutAnonymous(client.id, courtId)
      .then(checkins => {
        console.log('Done checking clientId/' + client.id + ' out of courtId/' + courtId);
        console.log('checkedout message sent from server to client');
        client.emit('checkedout', {courtId, checkins});
        client.broadcast.emit('checkedout', {courtId, checkins})
      })
      .catch(err =>{
        console.log('Failed to check user out');
        console.log(err);
        client.emit('checkout-failed', {error: 'Failed to check user out'})
      })
  })
  
  client.on('disconnect', () =>{ // Check clients out when they go offline
    console.log('clientId/' + client.id + ' disconnected. Checking them out from any court they were checked into');
    courtHelpers.checkoutAnonymousOnDisconnect(client.id)
      .then(courtInfo => {
          if (courtInfo !== null && courtInfo){
            const {courtId, checkins} = courtInfo;
            // client.emit('checkedout', {courtId, checkins});
            // Don't worry about emitting the message back to the sender because they are disconnected
            // Just broadcast the message to every other clients still online
            if (courtId && checkins){
              console.log('Broadcasting disconnected client checkout message')
              client.broadcast.emit('checkedout', {courtId, checkins});
            } else{
              console.log('Client was not checked in')
            }
          }
      })
      .catch(err =>{
        console.log('Failed to check user out');
        console.log(err);
        client.emit('checkout-failed', {error: 'Failed to check user out'})
      })
  })
})