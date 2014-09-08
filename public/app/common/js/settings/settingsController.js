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

            require(["text!app/common/ui/css/themes/" + theme + "/" + theme +".css"], _.bind(function (themeObj) {

                $("mss").remove();
                $(['<style type="text/css" id="mss">', themeObj, '</style>'].join('')).appendTo('head');

                this.raiseTrigger("theme");
            },this));
        },

        //----------------------------------------------------

        _loadDictionaries:function(){

            require(["app/assets/lib-extensions/requirejs/require.loadByType!i18n?"+app.settings.get("lang")], _.bind(function(i18nObjects){

                _.each(i18nObjects, function(obj){
                    app.translator.updateDictionary(obj);
                });
                this.raiseTrigger("dictionary");
            },this));
        },

        //----------------------------------------------------

        raiseTrigger:function(field){

            this[field+"Loaded"] = true;

            if(this.themeLoaded && this.dictionaryLoaded){
                app.channel.vent.trigger("onSettingsLoaded");
            }
        }
    });

    return SettingsController;
});