define(function (require) {
    "use strict";

    require("backbone.localstorage");
    require("lib-extensions/marionette/marionette.extensions");
    require("app/assets/js/lib-extensions/requirejs/require.loadByType!modules");

    var app = require("mbApp");
    var Backbone = require("backbone");
    var Translator = require("i18n/translator");
    var Context = require("assets-models/context");
    var SettingsController = require("assets-controllers/settingsController");
    var FrameLayoutController = require("frame-controllers/frameLayoutController");


    //------------------------------------------
    // init
    //------------------------------------------

    app.on("before:start", function () {

        app.translator = Translator;
        app.context = new Context();
        app.frame = new FrameLayoutController();
        app.settingsController = new SettingsController();
    });

    //------------------------------------------
    // start
    //------------------------------------------

    app.on("start", function () {

        app.channel.vent.once("onSettingsLoaded", onSettingsLoaded);
        app.settingsController.fetch();
    });

    //------------------------------------------

    var onSettingsLoaded =function(){

        setLayout();
        startHistory();
        removeSplashScreen();
    };

    //------------------------------------------

    var setLayout = function () {

        app.addRegions({
            mainRegion: '.mb'
        });

        app.frame.setLayout(app.mainRegion);
    };

    //------------------------------------------

    var startHistory = function () {

        if (Backbone.history) {
            Backbone.history.start();
        }
    };

    //-------------------------------------------

    var removeSplashScreen = function () {

        $(".spinner").hide();
        $(".mb").show();
    };

    return {};
});