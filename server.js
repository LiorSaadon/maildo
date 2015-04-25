var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 8000;
var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

console.log("PORT " + PORT);
console.log("IPADDRESS " + IPADDRESS);

var path = require('path');
var express = require('express');
var mails = require('./backEnd/routes/mails/mails');
var dbManager = require('./backEnd/managers/dbManager');
var socketManager = require('./backEnd/managers/socketManager');

var app = express();
app.use(express.static(path.join(__dirname, 'frontEnd')));

var server = require('http').createServer(app);
server.listen(PORT, IPADDRESS);

var io = require('socket.io').listen(server);

dbManager.connect(function(Models){

    mails.setModel(Models.MailModel);

    io.sockets.on('connection', function (socket) {

        console.log("io.sockets connection successful");
        socketManager.setIO(io);

        socket.on('add-user', function(userName){
            console.log("add-user successful");
            socketManager.addSocket(socket, userName);
        });
        socket.on('mail:create', function (userName, data) {
            console.log("mail:create successful");
            mails.addItem(socket, userName, data);
        });
        socket.on('mail:delete', function (userName, data) {
            mails.deleteItem(socket, userName, data);
        });
        socket.on('mails:read', function (userName, data) {
            mails.getList(socket, userName, data);
        });
        socket.on('mails:delete', function (userName, data) {
            mails.deleteBulk(socket, userName, data);
        });
        socket.on('mail:update', function (userName, data) {
            mails.updateItem(socket, userName, data);
        });
        socket.on('mails:update', function (userName, data) {
            mails.updateBulk(socket, userName, data);
        });
        socket.on('disconnect', function() {
            socketManager.removeSocket(socket);
        });
    });
});
