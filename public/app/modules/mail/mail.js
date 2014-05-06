define(function (require) {
    "use strict";

    var app = require("mbApp");

    app.module('mail', function (mail, App,  Backbone, Marionette, $, _) {

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
            this.routerController = new RouterController();
            this.router = new Router({ controller: this.routerController });
        });

        this.getLayout =function(){
            return this.layoutController.getLayout();
        };
    });

    return app.module("mail");
});