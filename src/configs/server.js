// server modules
var http = require('http');
var https = require('https');
var fs = require('fs'); // To read ssl key and cert

module.exports = function(app) {
  // http server
  var server = http
    .createServer(app)
    .listen(5000, function() {
      console.log('HTTP  server listening on port ' + 5000);
    });

  var io = require('socket.io')(server);
  io.on(
    'connection',
    require('../controllers/ApiController').websocketHandler(io)
  );
};