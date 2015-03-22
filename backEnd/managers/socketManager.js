module.exports = function() {

    var _ = require("underscore");

    var io;
    var _sockets = {};

    //-----------------------------------------------------------

    var setIO = function(_io){
        io = _io;
    };

    //-----------------------------------------------------------

    var addUser = function(socket, userName){

        if(!_.isEmpty(userName)){
            _sockets[userName] = _sockets[userName] || [];
            _sockets[userName].push(socket.id);
        }
    };

    //-----------------------------------------------------------

    var emit = function(username, eventName, message){

        var userSockets = _sockets[username];

        if(_.isArray(userSockets)){
            _.each(userSockets, function(socketId){
                io.sockets.connected[socketId].emit(eventName, message);
            });
        }
    };

    //-----------------------------------------------------------

    var removeUser = function(userName, socket){

        var userSockets = _sockets[userName];

        console.log("3434");

//        if(_.isArray(userSockets)){
//            console.log(userSockets);
//            _.each(userSockets, function(socketId){
//                console.log(socketId);
//                if(socket.id === socketId){
//                    userSockets = _.without(userSockets, socketId);
//                    console.log(userSockets);
//                }
//            });
//        }

    };

    return {
        emit:emit,
        setIO:setIO,
        addUser:addUser,
        removeUser:removeUser
    };
}();
