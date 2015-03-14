define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Marionette = require('marionette');
    var io = require('socketio');

    var Socket = Marionette.Controller.extend({

        create:function(options){
            var _socket = io('http://localhost:3000/');

            /**
             * On any event from the server, trigger it on the app event aggregator. The first
             * argument will always be the name of the event.
             */
            _socket.on('*', function(){
                var args = Array.prototype.slice.call(arguments, 0);
                app.vent.trigger(args[0], args.slice(1));
            });

            /**
             * On error, trigger the socket:error event on the global event aggregator for
             * interested listeners.
             */
            _socket.on('error', function(err){
                app.vent.trigger('socket:error', err);
            });

            return _socket;
        }
    });

    return Socket;
});