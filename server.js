require('dotenv').config();
let axios = require('axios');
let express = require('express');


let app = express();
let PORT = process.env.PORT || 8080;

// Enable CORS
// TODO only allow requests from hoopsgram.com
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

let seedRoutes = require('./controllers/seeds');
let apiRoutes = require('./controllers/api')

app.get('/', (req, res) => {
  res.send("Hello");
})

app.use('/seed', seedRoutes);

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`hoopsgram api server listening on: ${PORT}`)
})