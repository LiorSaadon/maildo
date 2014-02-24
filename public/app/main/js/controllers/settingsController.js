define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var Settings = require("main-models/settings");

    var SettingsController = Marionette.Controller.extend({


        //---------------------------------------------------
        // initialize
        //---------------------------------------------------

        initialize: function (options) {

            this.settings = new Settings({id: 1});
        },

        //---------------------------------------------------
        // getSettings
        //---------------------------------------------------

        getSettings: function(){

            return this.settings;
        },

        //---------------------------------------------------
        // load
        //---------------------------------------------------

        load: function(cb){

            this.settings.fetch({
                success: function(){
                    cb();
                },
                error:function(){
                }
            });
        },

        //---------------------------------------------------
        // load
        //---------------------------------------------------

        update: function(cb){

            this.settings.save(null,{
                success: function(){
                    cb();
                },
                error:function(){
                }
            });
        }
    });

    return SettingsController;
});