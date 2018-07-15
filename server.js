require('dotenv').config();
const express = require('express');
const courtHelpers = require('./models/court/details/helpers');
var Mixpanel = require('mixpanel');

var mixpanel = Mixpanel.init(process.env.MIXED_PANEL_TOKEN, {
    protocol: 'https'
});

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
// TODO only allow requests from hoopsgram.com
app.use(function(req, res, next) {
  if (process.env.NODE_ENV === 'production'){
    // res.header("Access-Control-Allow-Origin", "https://hoopsgram.herokuapp.com");
    res.header("Access-Control-Allow-Origin", "*");
  }else{
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// parse application/json
app.use(express.json())

const seedRoutes = require('./controllers/seeds');
const apiRoutes = require('./controllers/api')

app.get('/', (req, res) => {
  res.send("Hello");
})

app.get('/location/:lat/:lng', (req, res) =>{
  console.log(req.params.lat);
  console.log(req.params.lng);
  
  if (!req.params || !req.params.lat || !req.params.lng || !Number(req.params.lat) || !Number(req.params.lng)){     return res.status(400).send();
  }
  
  const {lat, lng} = req.params
  courtHelpers.getLocDetails({lat: Number(lat), lng:Number(lng)})
    .then(details =>{
      if (details) return res.json(details)
    })
    .catch(err => res.json(err))
 
})

app.use('/seed', seedRoutes);

app.use('/api', apiRoutes);

app.post('/checkin/:courtId', (req, res) =>{
    // Route to for anonymous checkins
    // No need for user to be logged in
    // Just get court's lat, lng and increase their checkins_current & checkins_total
    // if (!req.params.courtId){
    //     console.log("Bad request");
    //     return res.status(500).json("Bad request: expected a correct court id");
    // }
    
    // courtHelpers.checkinAnonymous(req.params.courtId)
    // .then((checkins) =>{
    //     // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
    //     if (client){
        
    //       // Notify listening clients with checkins count updates
    //       socket.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
    //       socket.broadcast.emit("checkin", {courtId: req.params.courtId, current: checkins.current, total:checkins.total});
    //     }
    //     return res.status(200).send();
    // })
    // .catch((err) => res.status(500).send() )
    res.json({msg: "This route does nothing"}); // Moved check in code into socket.io
    
})

app.post('/checkout/:courtId', (req, res) =>{
    // Route to for anonymous checkouts
    // No need for user to be logged in
    // Just get court's lat, lng and decrease their checkins_current & checkins_total
    // if (!req.params.courtId){
    //     console.log("Bad request");
    //     return res.status(500).json("Bad request: expected a correct court id");
    // }
    
    // courtHelpers.checkoutAnonymous(req.params.courtId)
    // .then((checkins) =>{
    //     // TODO: socket.io to broadcast the checkins_current (for now) to listening clients
    //     if (client){
        
    //       // Notify listening clients with checkins count updates
    //       socket.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
    //       socket.broadcast.emit("checkout", {courtId: req.params.courtId, current: checkins.current});
    //     }
        
    //     return res.status(200).send();
    // })
    // .catch(() => res.status(500).send());
    res.json({msg: "This route does nothing"}); // Moved check out code into socket.io
})

app.post('/track/:event', (req, res)=>{
  if (process.env.NODE_ENV === 'production'){
    // non_supported_cities,successful_visits,went_to_court,checked_in
    console.log('Tracking...');
    
    const {event} = req.params;
    if (!req.body || !req.body.lat || !req.body.lng) return res.status(400).send();
    
    if (event === 'non_supported_cities' || event === 'successful_visits' || event === 'went_to_court' || event === 'checked_in'){
      courtHelpers.getLocDetails(req.body)
        .then(loc =>{
          if (loc && loc.city && loc.city.length){
            console.log(`Event: ${event}`)
            console.log(`City: ${loc.city}`);
            console.log(`Country: ${loc.country}`);
            mixpanel.track(event, {'city': loc.city, 'country': loc.country});
          }
          res.send()
        })
        .catch(err => res.send())
    }else{
      res.send();
    }
  }else{
    console.log("In testing environment. No need to send data to mixpanel");
    res.send();
  }
})

let server = app.listen(PORT, () => {
  console.log(`hoopsgram api server listening on: ${PORT}`)
})

//SOCKET IO
let io = require("socket.io").listen(server);

io.on('connection', (socket) => {
  
  console.log('clientID/' + socket.id + ' connected')

  // When we get an 'online' msg with client coords, notify nearbycourts to increment their nearby online count
  socket.on('online', coords =>{
    console.log('clientId/' + socket.id + ' just came online');

    // Request connected clients usernames
    socket.broadcast.emit('get-username');
    
    courtHelpers.isClientOnline(socket.id).then(clientOnline =>{
      if (clientOnline){
        console.log(`ClientId/${socket.id} is already online. No need to update anything right now. Just chilling...`)
      }
      else{
        console.log(`ClientId/${socket.id} wasn't already online.`)

        courtHelpers.incrementCourtsNearbyOnlineCounts(socket.id,coords)
          .then(courtIds =>{
            // If not courts were found near the client, no need to broadcast anything
            if (courtIds.length){
              console.log('Broadcasting presence of clientId/' + socket.id + ' to courts near them')
              socket.broadcast.emit('increment_nearby_online_count', courtIds);
            }
          })
      }
    })
  })
  
  // When connected, keep an ear out for checkin messages and save the connected client
  socket.on('checkin', courtId =>{
    console.log('checkin message from clientId/'+ socket.id + ' received for courtId/' + courtId);
    console.log('checking client in...')
    courtHelpers.checkinAnonymous(socket.id, courtId)
      .then(checkins => {
        console.log('Done checking clientId/' + socket.id + ' into courtId/' + courtId);
        console.log('checkedin message sent from server to client');
        socket.emit('checkedin', {courtId, checkins});
        socket.broadcast.emit('checkedin', {courtId, checkins})
      })
      .catch(err =>{
        console.log('Failed to check user in');
        console.log(err);
        socket.emit('checkin-failed', {error: 'Failed to check user in'})
      })
  })
  
  // Keep an ear out for when clients disconnect so we can check them out
  socket.on('checkout', courtId =>{ 
    // Check clients out when we receive the checkout message
    console.log('checkout message from clientId/'+ socket.id + ' received for courtId/' + courtId);
    console.log('checking client out...')
    courtHelpers.checkoutAnonymous(socket.id, courtId)
      .then(checkins => {
        console.log('Done checking clientId/' + socket.id + ' out of courtId/' + courtId);
        console.log('checkedout message sent from server to client');
        socket.emit('checkedout', {courtId, checkins});
        socket.broadcast.emit('checkedout', {courtId, checkins})
      })
      .catch(err =>{
        console.log('Failed to check user out');
        console.log(err);
        // socket.emit('checkout-failed', {error: 'Failed to check user out'})
      })
  })

  // Keep an ear out for when clients send chat room messages and broadcast them to other clients in the same room
  socket.on('chatroom-msg', message =>{
    socket.broadcast.emit('new-chatroom-msg', message);
  })

  // Keep an ear out for new usernames and broadcast them to all listening clients so that other people don't use them
  socket.on('username', username =>{
    socket.broadcast.emit('new-username', username);
  })
  
  // Check clients out when they go offline and notify courts near them to decrement they nearby online counts
  socket.on('disconnect', () =>{ 
    console.log(`clientId/${socket.id} disconnected.`)
    courtHelpers.checkoutAnonymousOnDisconnect(socket.id)
      .then(courtInfo => {
          if (courtInfo !== null && courtInfo){
            const {courtId, checkins} = courtInfo;
            // Don't worry about emitting the message back to the sender because they are disconnected
            // Just broadcast the message to every other clients still online
            if (courtId && checkins){
              console.log('Broadcasting disconnected client checkout message')
              socket.broadcast.emit('checkedout', {courtId, checkins});
            } else{
              console.log('Client was not checked in')
            }
          }
      })
      .catch(err =>{
        console.log('Failed to check user out');
        console.log(err);
        // socket.emit('checkout-failed', {error: 'Failed to check user out'})
      })

    courtHelpers.decrementCourtsNearbyOnlineCounts(socket.id).then(courtIds =>{
      // If not courts were found near the client, no need to broadcast anything
      if (courtIds.length){
        console.log('Broadcasting offline status of clientId/' + socket.id + ' to courts near them')
        socket.broadcast.emit('decrement_nearby_online_count', courtIds);
      }
    })
  })
})