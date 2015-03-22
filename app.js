var express = require('express'),
    path = require('path'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    mails = require('./backEnd/routes/mails/mails'),
    dbManager = require('./backEnd/managers/dbManager'),
    socketManager = require('./backEnd/managers/socketManager');

dbManager.connect(function(Models){

    app.use(express.static(path.join(__dirname, 'frontEnd')));

    server.listen(3000, function () {
        console.log("Express server listening on port 3000");
    });

    mails.setModel(Models.MailModel);

    io.sockets.on('connection', function (socket) {

        socketManager.setIO(io);

        socket.on('add-user', function(userName){
            socketManager.addUser(socket, userName);
        });
        socket.on('mail:create', function (userName, data) {
            mails.addItem(userName, data);
        });
        socket.on('mail:delete', function (userName, data) {
            mails.deleteItem(userName, data);
        });
        socket.on('mails:read', function (userName, data) {
            mails.getList(userName, data);
        });
        socket.on('mails:delete', function (userName, data) {
            mails.deleteBulk(userName, data);
        });
        socket.on('mails:update', function (userName, data) {
            mails.updateBulk(userName, data);
        });
        socket.on('disconnect', function(userName) {
            socketManager.removeUser(userName, socket);
        });
    });
});



