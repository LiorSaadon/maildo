define(function (require) {
    "use strict";

    require("mail-module");
    require("tasks-module");
    require("backbone.sync");
    require("extensions/marionette/marionette.extensions");

    var app = require("mbApp");
    var Frame = require("frame");
    var Backbone =  require("backbone");
    var Translator = require("i18n/translator");
    var Context = require("common-context/context");
    var Socket = require("common/socket/socket");
    var SettingsController = require("common-settings/settingsController");


    //------------------------------------------
    // init
    //------------------------------------------

    app.on("before:start", function () {

        app.translator = Translator;
        app.context = new Context();
        app.frame = new Frame();
        app.socket = new Socket().create();
        app.settingsController = new SettingsController();
    });

    //------------------------------------------
    // start
    //------------------------------------------

    app.on("start", function () {

        app.channel.vent.once("onSettingsLoaded", onSettingsLoaded);
        app.settingsController.fetch();
        setWindowEvents();
    });

    //------------------------------------------

    var onSettingsLoaded = function(){

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

    var setWindowEvents = function(){

        window.addEventListener("unload", app.socket.close);
    };

    //-------------------------------------------

    var removeSplashScreen = function () {

        $(".spinner").hide();
        $(".mb").show();
    };

    return {};
});