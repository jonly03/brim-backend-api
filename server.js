require('dotenv').config();
let axios = require('axios');
let express = require('express');


let app = express();
let PORT = process.env.PORT || 8080;

let apiRoutes = require('./controllers/api')

app.use('/api', apiRoutes);

app.listen(PORT, process.env.IP, () => {
  console.log(`hoopsgram api server listening on ${process.env.IP}:${PORT}`)
})