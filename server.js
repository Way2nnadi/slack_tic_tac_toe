var express = require('express');
var server = express();
var bodyParser = require('body-parser');

// MIDDLE-WARE
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));

// CONFIGURE SERVER
server.set('port', process.env.PORT || 3002);

server.listen(server.get('port'), () => {
	console.log('Listening on Port:' + server.get('port'));
})

module.exports = server;	
