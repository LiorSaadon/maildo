var express = require('express'),
    path = require('path'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    mails = require('./backEnd/routes/mails/mails'),
    dbManager = require('./backEnd/managers/dbManager');

dbManager.connect(function(Models){

    app.use(express.static(path.join(__dirname, 'frontEnd')));

    server.listen(3000, function () {
        console.log("Express server listening on port 3000");
    });

    mails.setModel(Models.MailModel);

    io.sockets.on('connection', function (socket) {

        socket.on('mail:create', function (data) {
            mails.addItem(io,data);
        });
        socket.on('mail:delete', function (data) {
            mails.deleteItem(io,data);
        });
        socket.on('mails:read', function (data) {
            mails.getList(io,data);
        });
        socket.on('mails:delete', function (data) {
            mails.deleteBulk(io,data);
        });
        socket.on('mails:update', function (data) {
            mails.updateBulk(io,data);
        });
    });
});



