define(function (require) {
    "use strict";

    var app = require("mbApp");
    var eModules = require('json!assets-data/eModules.json');

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        require("tasks-storage/tasksStorageInitializer");

        var LayoutController = require("tasks-controllers/tasksLayoutController");
        var RouterController = require("tasks-controllers/tasksRouterController");
        var DataController = require("tasks-controllers/tasksDataController");
        var ActionsController = require("tasks-controllers/tasksActionsController");
        var Router = require("tasks-routers/tasksRouter");

        this.addInitializer(function (options) {

            this.channel = Backbone.Wreqr.radio.channel("tasks");
            this.dataController = new DataController(options);
            this.layoutController = new LayoutController(options);
            this.actionsController = new ActionsController();
            this.router = new Router({ controller: new RouterController() });
        });

        this.setLayout =function(){
            return this.layoutController.setViews();
        };
    });

    return app.module("tasks");
});