module.exports = function(__dirname) {

    var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8000;
    var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

    var path = require('path');
    var express = require('express');
    var favicon = require('serve-favicon');

    var app = express();
    app.set('view engine', 'ejs');
    app.use(favicon(__dirname + '/favicon.ico'));
    app.set('views', path.join(__dirname, '/server/views'));
    app.use(express.static(path.join(__dirname, 'client')));

    var server = require('http').createServer(app);
    server.listen(PORT, IPADDRESS);

    require('./routesStarter')(app, __dirname);
    require('./socketStarter')(server);
};

