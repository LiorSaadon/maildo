module.exports = function() {

    var _ = require("underscore");
    var socketManager = require('../common/socketManager');

    //--------------------------------------------------------
    // resell
    //--------------------------------------------------------

    var resell = function(io, socket,  modules){

        socket.on('add-user', function (userName) {
            socketManager.addSocket(socket, userName);
        });

        socket.on('disconnect', function () {
            socketManager.removeSocket(socket);
        });

        _.each(modules, function (module) {
            module.addListeners(io, socket)
        });
    };

    return{
        resell:resell
    }
}();
