require("./vendorsLoader");

var app = require('app');
var Frame = require("frame");
var Context = require("context");
var MailModule = require("mail-module");
var Translator = require("resolvers/translator");
var SocketController = require("socket-controller");
var SettingsController = require("settings-controller");


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

app.start();






