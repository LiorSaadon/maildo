define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Marionette = require('marionette');
    var io = require('socketio');

    var Socket = Marionette.Controller.extend({

        create:function(options){

            this._socket = io('http://localhost:3000/');

            this._socket.emit('add-user',"shaulm");

            this._socket.on('data:change', function(message){
                app.vent.trigger("data:change", message);
            });

            this._socket.on('error1', function(err){
                app.vent.trigger('socket:error', err);
            });

            return this._socket;
        },

        close: function(){
            this._socket.close("shaulm")
        }
    });

    return Socket;
});