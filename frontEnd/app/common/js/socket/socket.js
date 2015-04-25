define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Marionette = require('marionette');
    var UrlUtility = require("resolvers/UrlUtility");
    var io = require('socketio');

    var Socket = Marionette.Controller.extend({

        create:function(options){

            var socketURI = window.location.hostname + ":" + "8000" + "/";
            this._socket = io.connect(socketURI);

            this._socket.on('connect', function() {
                console.log('connection to server established.');
            });
            this._socket.on('error', function() {
                console.log('sorry, we are experiencing technical difficulties.');
            });

            var userName = UrlUtility.getParameterByName("username");
            userName = _.isEmpty(userName) ? "guest": userName;

            this._socket.emit('add-user',userName);

            this._socket.on('data:change', function(message){
                app.vent.trigger("data:change", message);
            });

            this._socket.on('error1', function(err){
                app.vent.trigger('socket:error', err);
            });

            return this._socket;
        },

        close: function(){
            this._socket.close("shaulm");
        }
    });

    return Socket;
});