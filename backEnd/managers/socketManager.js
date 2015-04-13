module.exports = function() {

    var _ = require("underscore");

    var io;
    var _users = {};

    //-----------------------------------------------------------

    var setIO = function(_io){
        io = _io;
    };

    //-----------------------------------------------------------

    var addSocket = function(socket, userName){

        if(!_.isEmpty(userName)){
            _users[userName] = _users[userName] || [];
            _users[userName].push(socket.id);
        }
    };

    //-----------------------------------------------------------

    var emit = function(socket, eventName, message, userName){

        console.log(eventName);

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

    //-----------------------------------------------------------

    var removeSocket = function(socket){

        _.each(_users, function(val, key){
            if(_.indexOf(val, socket.id) >= 0){
                _users[key] = _.without(val, socket.id);
            }
        });
    };

    return {
        emit:emit,
        setIO:setIO,
        addSocket:addSocket,
        removeSocket:removeSocket
    };
}();
