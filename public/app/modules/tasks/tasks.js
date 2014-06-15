define(function (require) {
    "use strict";

    var app = require("mbApp");

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        var LayoutController = require("tasks-controllers/tasksLayoutController");
        var RouterController = require("tasks-controllers/tasksRouterController");
        var DataController = require("tasks-controllers/tasksDataController");
        var Router = require("tasks-routers/tasksRouter");

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

    return app.module("tasks");
});