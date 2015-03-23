module.exports = function() {

    var _ = require("underscore");

    var io;
    var _users = {};

    //-----------------------------------------------------------

    var setIO = function(_io){
        io = _io;
    };

    //-----------------------------------------------------------

    var addUser = function(socket, userName){

        if(!_.isEmpty(userName)){
            _users[userName] = _users[userName] || [];
            _users[userName].push(socket.id);
        }
    };

    //-----------------------------------------------------------

    var emit = function(username, eventName, message){

        var socketList = _users[username];

        if(_.isArray(socketList)){
            _.each(socketList, function(socketId){
                io.sockets.connected[socketId].emit(eventName, message);
            });
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

    return {
        emit:emit,
        setIO:setIO,
        addUser:addUser,
        removeUser:removeUser
    };
}();
