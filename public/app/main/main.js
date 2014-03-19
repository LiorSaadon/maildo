define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Backbone = require("backbone");
    var MarionetteExt = require("lib-extensions/marionette/marionette.ext");
    var localStorage = require("backbone.localstorage");
    var Translator = require("i18n/translator");
    var Context = require("main-models/context");
    var Settings = require("main-models/settings");
    var Modules = require("requirejs-plugins/require.loadByType!modules");
    var ThemesController = require("main-controllers/themesController");
    var MainLayoutController = require("main-controllers/mainLayoutController");

    //------------------------------------------
    // init
    //------------------------------------------

    app.on("initialize:before", function(){

        app.vent = new Backbone.Wreqr.EventAggregator();

        app.translator = Translator;
        app.context = new Context();
        app.settings = new Settings();
        app.themesController = new ThemesController();
        app.layoutController = new MainLayoutController();
    });

    //------------------------------------------
    // start
    //------------------------------------------

    app.on("start", function(){

        app.settings.fetch({
            success:function(){
              loadTheme();
              setLayout();
              startHistory();
            }
        });
    });

    //--------------------------------------------------

    var loadTheme = function(){

        app.vent.once("onCssLoaded", removeSplashScreen);
        app.themesController.loadTheme(app.settings.get("selectedTheme"));
    };

    //------------------------------------------

    var setLayout = function(){

        app.addRegions({
            mainRegion:'.mb'
        });

        app.layoutController.setLayout(app.mainRegion);
    };

    //------------------------------------------

    var startHistory = function(){

        if (Backbone.history){
            Backbone.history.start();
        }
    };

    //-------------------------------------------

    var removeSplashScreen = function(){

         $(".spinner").hide();
         $(".mb").show();
    };

    return app;
});