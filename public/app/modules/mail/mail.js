define(function (require) {
    "use strict";

    var app = require("mbApp");

    app.module('mail', function (mail, App,  Backbone, Marionette, $, _) {

        require("mail-controllers/mailPreliminaryDataController");

        var LayoutController = require("mail-controllers/mailLayoutController");
        var DataController = require("mail-controllers/mailDataController");
        var ActionsController = require("mail-controllers/mailActionsController");
        var ComposeActionsController = require("mail-controllers/composeActionsController");
        var Router = require("mail-routers/mailRouter");
        var RouterController = require("mail-controllers/mailRouterController");

        this.addInitializer(function (options) {
            this.vent = new Backbone.Wreqr.EventAggregator();
            this.dataController = new DataController();
            this.actionsController = new ActionsController();
            this.composeActionsController = new ComposeActionsController();
            this.layoutController = new LayoutController(options);
            this.router = new Router({ controller: new RouterController() });
        });

        this.setLayout =function(){
            return this.layoutController.setViews();
        };
    });

    return app.module("mail");
});