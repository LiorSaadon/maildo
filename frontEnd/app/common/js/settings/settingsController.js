define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Marionette = require('marionette');
    var Settings = require("common-settings/settings");

    var SettingsController = Marionette.Controller.extend({

        initialize:function(){
            app.settings = new Settings();
        },

        //----------------------------------------------------

        fetch:function(){

            app.settings.fetch({
                success: _.bind(function () {
                    this._loadTheme();
                    this._loadDictionaries();
                },this)
            });
        },

        //----------------------------------------------------

        _loadTheme:function(){

            var theme = app.settings.get("theme");

            require(["text!app/assets/ui/css/themes/" + theme + "/" + theme +".css"], _.bind(function (themeObj) {

                $("theme-css").remove();
                $(['<style type="text/css" id="theme-css">', themeObj, '</style>'].join('')).appendTo('head');

                this.raiseTrigger("theme");
            },this));
        },

        //----------------------------------------------------

        _loadDictionaries:function(){

            require(["app/assets/ui/i18n/"+app.settings.get("lang")], _.bind(function(i18nObject){

                app.translator.updateDictionary(i18nObject);
                this.raiseTrigger("dictionary");
            },this));
        },

        //----------------------------------------------------

        raiseTrigger:function(field){

            this[field+"Loaded"] = true;

            if(this.themeLoaded && this.dictionaryLoaded){

                setTimeout(function(){
                    app.channel.vent.trigger("onSettingsLoaded");
                },0);
            }
        }
    });

    return SettingsController;
});