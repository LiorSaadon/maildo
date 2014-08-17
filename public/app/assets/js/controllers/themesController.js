define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');

    var ThemesController = Marionette.Controller.extend({

        themes: [],

        //-----------------------------------------------------------

        loadTheme:function(themeName){

            if(_.isEmpty(this.themes[themeName])){
                var file = "text!app/assets/ui/css/themes/" + themeName + "/" + themeName +".css";
                require([file], _.bind(function (data) {
                    this.themes[themeName] = data;
                    this.addTheme(data);
                },this));
            }else{
                this.addTheme(this.themes[themeName]);
            }
        },

        //-----------------------------------------------------------

        addTheme:function(data){

            $("mss").remove();
            $(['<style type="text/css" id="mss">', data, '</style>'].join('')).appendTo('head');
            app.channel.vent.trigger("onCssLoaded");
        }
    });

    return ThemesController;
});