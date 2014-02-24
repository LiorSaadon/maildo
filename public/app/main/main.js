define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Backbone = require("backbone");
    var MarionetteExt = require("lib-extensions/marionette/marionette.ext");
    var localStorage = require("backbone.localstorage");
    var Translator = require("i18n/translator");
    var Context = require("main-models/context");
    var Modules = require("requirejs-plugins/require.loadByType!modules");
    var ThemesController = require("main-controllers/themesController");
    var SettingsController = require("main-controllers/settingsController");
    var MainLayoutController = require("main-controllers/mainLayoutController");
    var DataController = require("main-controllers/dataController");

    //------------------------------------------
    // init
    //------------------------------------------

    app.on("initialize:before", function(){

        app.vent = new Backbone.Wreqr.EventAggregator();

        app.translator = Translator;
        app.context = new Context();
        app.themesController = new ThemesController();
        app.settingsController = new SettingsController();
        app.layoutController = new MainLayoutController();
        app.dataController = new DataController();
    });

    //------------------------------------------
    // start
    //------------------------------------------

    app.on("start", function(){

        app.settingsController.load(function(){

            loadTheme();
            setLayout();
            startHistory();
        });
    });

    //--------------------------------------------------

    var loadTheme = function(){

        app.vent.once("onCssLoaded", removeSplashScreen);
        app.themesController.loadTheme(app.settingsController.getSettings().get("selectedTheme"));
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