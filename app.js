//http://code.tutsplus.com/tutorials/authenticating-nodejs-applications-with-passport--cms-21619
//https://github.com/tutsplus/passport-mongo/blob/master/app.js

var express = require('express');
var path = require('path');
var http = require('http');
var mails = require('./backEnd/routes/mails/mails');
var dbManager = require('./backEnd/managers/dbManager');
var socketManager = require('./backEnd/managers/socketManager');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

app.use(express.static(path.join(__dirname, 'frontEnd')));

server.listen(3000, function () {
    console.log("Express server listening on port 3000");
});

dbManager.connect(function(Models){

    mails.setModel(Models.MailModel);

    io.sockets.on('connection', function (socket) {

        socketManager.setIO(io);

        socket.on('add-user', function(userName){
            socketManager.addSocket(socket, userName);
        });
        socket.on('mail:create', function (userName, data) {
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
