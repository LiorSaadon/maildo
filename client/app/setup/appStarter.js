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
    var SocketController = require("common/socket/socketController");
    var SettingsController = require("common-settings/settingsController");


    //------------------------------------------
    // init
    //------------------------------------------

    app.on("before:start", function () {

        app.translator = Translator;
        app.context = new Context();
        app.frame = new Frame();
        app.socketController = new SocketController();
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

    var onSettingsLoaded = function(){

        registerUser();
        setLayout();
        startHistory();
        removeSplashScreen();
    };

    //------------------------------------------

    var registerUser = function () {
        app.socketController.registerUser(app.settings.get("userName"));
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
        Backbone.history.start();
    };

    //-------------------------------------------

    var removeSplashScreen = function () {

        $(".spinner").hide();
        $(".mb").show();
    };

    return {};
});