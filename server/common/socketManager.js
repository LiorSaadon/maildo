var SocketManager = (function() {

    var _  = require("underscore");

    var io;
    var _users = {};

    //-----------------------------------------------------------

    var set = function(server, modules, callback){

        io = require('socket.io').listen(server);

        io.sockets.on('connection', function (socket) {

            socket.on('add-user', function (userName) {
                addUser(socket, userName);
            });

            socket.on('disconnect', function () {
                removeUser(socket);
            });

            _.each(modules, function (module) {
                module.addListeners(SocketManager, socket);
            });
        });

        callback();
    };

    //-----------------------------------------------------------

    var addUser = function(socket, userName){

        if(!_.isEmpty(userName)){
            _users[userName] = _users[userName] || [];
            _users[userName].push(socket.id);
        }
    };

    //-----------------------------------------------------------

    var removeUser = function(socket){

        _.each(_users, function(val, key){
            if(_.indexOf(val, socket.id) >= 0){
                _users[key] = _.without(val, socket.id);
            }
        });
    };

    //-----------------------------------------------------------

    var emit = function(socket, eventName, message, userName){

        socket.emit(eventName, message);

       if(!_.isEmpty(userName)){
            var socketList = _users[userName];

            if(_.isArray(socketList)){
                _.each(socketList, function(socketId){
                    io.sockets.connected[socketId].emit("data:change", {"originalEventName":eventName});
                });
            }
        }
    };

    return {
        set:set,
        emit:emit
    };
})();

module.exports = SocketManager;
