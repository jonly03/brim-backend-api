require('dotenv').config();
let axios = require('axios');
let express = require('express');


let app = express();
let PORT = process.env.PORT || 8080;

// Enable CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

let apiRoutes = require('./controllers/api')

app.use('/api', apiRoutes);

app.listen(PORT, process.env.IP, () => {
  console.log(`hoopsgram api server listening on ${process.env.IP}:${PORT}`)
})