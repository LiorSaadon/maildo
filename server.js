var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 8000;
var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var path = require('path');
var express = require('express');
var appStart = require('./backEnd/appStart');

var app = express();
app.use(express.static(path.join(__dirname, 'frontEnd')));

var server = require('http').createServer(app);
server.listen(PORT, IPADDRESS);

appStart.start(server);