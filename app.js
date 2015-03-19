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


    var t = { _id: "550a72e502827210173f2b50",
        from: 'demo@mailbone.com',
        to: 'patricia.white@mailbone.com;michael.martin@mailbone.com;',
        cc: 'williams@mailbone.com',
        bcc: '',
        subject: 'Things You Can Do With JavaScript',
        sentTime: '2014-04-12 15:06:51',
        body: 'later',
        userId: '1',
        relatedBody: 'mail1',
        id: '_mke1QishK',
        __v: 0,
        groups: { sent: true },
        labels: { read: true, starred: true, important: true } };

    t.labels = {"xx":"ttt"};
    console.log(t);

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



