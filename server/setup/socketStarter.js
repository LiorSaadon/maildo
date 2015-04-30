module.exports = function(server) {

    var mails = require('../routes/mails/mails');
    var dbManager = require('../managers/dbManager');
    var socketManager = require('../managers/socketManager');
    var io = require('socket.io').listen(server);

    dbManager.connect(function(Models) {

        mails.setModel(Models.MailModel);

        io.sockets.on('connection', function (socket) {

            socketManager.setIO(io);

            socket.on('add-user', function (userName) {
                socketManager.addSocket(socket, userName);
            });
            socket.on('disconnect', function () {
                socketManager.removeSocket(socket);
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
        });
    });
};

