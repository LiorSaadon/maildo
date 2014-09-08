define(function (require) {
    "use strict";

    require("backbone.localstorage");
    require("lib-extensions/marionette/marionette.extensions");
    require("app/assets/lib-extensions/requirejs/require.loadByType!modules");

    var app = require("mbApp");
    var Backbone = require("backbone");
    var Translator = require("i18n/translator");
    var Context = require("common-context/context");
    var Settings = require("common-settings/settings");
    var ThemesController = require("common-settings/themesController");
    var FrameLayoutController = require("frame-controllers/frameLayoutController");


    //------------------------------------------
    // init
    //------------------------------------------

    app.on("before:start", function () {

        app.translator = Translator;
        app.context = new Context();
        app.settings = new Settings();
        app.frame = new FrameLayoutController();
        app.themesController = new ThemesController();
    });

    //------------------------------------------
    // start
    //------------------------------------------

    app.on("start", function () {

        app.settings.fetch({
            success: function () {
                loadTheme();
                setLayout();
                startHistory();
            }
        });
    });

    //--------------------------------------------------

    var loadTheme = function () {

        app.channel.vent.once("onCssLoaded", removeSplashScreen);
        app.themesController.loadTheme(app.settings.get("selectedTheme"));
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