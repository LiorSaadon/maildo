define(function (require) {
    "use strict";

    var app = require("mbApp");

    app.module('notepad', function (notepad, app,  Backbone, Marionette, $, _) {

        var LayoutController = require("notepad-controllers/notepadLayoutController");
        var RouterController = require("notepad-controllers/notepadRouterController");
        var DataController = require("notepad-controllers/notepadDataController");
        var Router = require("notepad-routers/notepadRouter");

        this.addInitializer(function (options) {
            this.vent = new Backbone.Wreqr.EventAggregator();
            this.dataController = new DataController(options);
            this.layoutController = new LayoutController(options);
            this.routerController = new RouterController();
            this.router = new Router({ controller: this.routerController });
        });

        this.getLayout =function(){
            return this.layoutController.getLayout();
        };
    });

    return app.module("notepad");
});