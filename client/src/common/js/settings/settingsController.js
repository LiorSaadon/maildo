"use strict";

var app = require('app');
var Settings = require("./settings");

var SettingsController = Marionette.Controller.extend({

    initialize: function () {
        app.settings = new Settings();
    },

    //----------------------------------------------------

    fetch: function () {

        this.loadThemeAndDic();

        //app.settings.fetch({
        //    success: _.bind(function (model, resp, options) {
        //            this.loadThemeAndDic();
        //    }, this)
        //});
    },

    //------------------------------------------------------

    loadThemeAndDic:function(){

        var theme = app.settings.get("theme");

        $.when(
            $.getJSON("dist/i18n/" + app.settings.get("lang") + ".json", function(i18nObject) {
                app.translator.updateDictionary(i18nObject);
            }),
            $.get("dist/css/themes/" + theme + "/" + theme + ".css", function(_css) {
                $("theme-css").remove();
                $(['<style type="text/css" id="theme-css">', _css, '</style>'].join('')).appendTo('head');
            })
        ).then(function() {
                app.channel.vent.trigger("onSettingsLoaded");
        });
   }
});

module.exports = SettingsController;
