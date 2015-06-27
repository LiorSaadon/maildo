    "use strict";

    var app = require("app");

    app.module('mail', function (mail, App,  Backbone, Marionette, $, _) {

        var Router = require("mail-routers/mailRouter");
        var MainLayoutController = require("mail-controllers/mailMainLayoutController");
        var DataController = require("mail-controllers/mailDataController");
        var ActionsController = require("mail-controllers/mailActionsController");
        var RouterController = require("mail-controllers/mailRouterController");

        //------------------------------------------
        // init
        //------------------------------------------

        this.addInitializer(function (options) {

            this.channel = Backbone.Wreqr.radio.channel("mail");
            this.dataController = new DataController();
            this.actionsController = new ActionsController();
            this.mainLayoutController = new MainLayoutController(options);
            this.router = new Router({ controller: new RouterController() });
        });

        //------------------------------------------
        // setLayout
        //------------------------------------------

        this.setLayout =function(){
            return this.mainLayoutController.setViews();
        };
    });

    module.exports = app.module("mail");
