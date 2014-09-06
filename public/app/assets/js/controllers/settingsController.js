define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var Settings = require("assets-models/settings");

    var ThemesController = Marionette.Controller.extend({


        initialize:function(){
            this.settings = new Settings();
        },

        //--------------------------------------------

        fetch:function(){

            app.settings.fetch({
                success:function(){
                    this._loadTheme();
                    this._loadDictionaries();
                }
            })
        },

        //----------------------------------------------

        _loadTheme:function(){

            require([file], _.bind(function (data) {

                $("mss").remove();
                $(['<style type="text/css" id="mss">', data, '</style>'].join('')).appendTo('head');
                this.themeLoaded = true;
                raiseTrigger();
            },this));
        },

        _loadDictionaries:function(){

            var fileTo = ("app/assets/js/lib-extensions/requirejs/require.loadByType!i18n?"+this.settings.get("locale"));

            require(fileTo, _.bind(function (i18nObjects) {
                _.each(i18nObjects, function(obj){
                    app.Translator.addDic(obj);
                });
                raiseTrigger();

            },this));
        },


        raiseTrigger:function(){

            if(themeLoaded && dictionaryLoaded){
                setTimeout(function(){
                    app.channel.vent.trigger("onSettingsLoaded");
                },250);
            }
        }

        save:function(){

        }
    });

    return ThemesController;
});