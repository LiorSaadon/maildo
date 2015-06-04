module.exports = function() {

    var _ = require("underscore");

    var _users = {};

    //-----------------------------------------------------------

    var addSocket = function(socket, userName){

        if(!_.isEmpty(userName)){
            _users[userName] = _users[userName] || [];
            _users[userName].push(socket.id);
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

    //-----------------------------------------------------------

    var emit = function(io, socket, eventName, message, userName){

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
        emit:emit,
        addSocket:addSocket,
        removeSocket:removeSocket
    };
}();
