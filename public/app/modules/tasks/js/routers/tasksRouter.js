define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TasksRouter = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksRouter = Marionette.AppRouter.extend({

            appRoutes: {
                "tasks": "tasks",
                "newTask": "newTask"
            },

            //---------------------------------------------
            // route
            //---------------------------------------------

            route: function (route, name, callback) {
                return Backbone.Router.prototype.route.call(this, route, name, function () {
                    this.before();
                    callback.apply(this, arguments);
                });
            },

            //---------------------------------------------
            // before
            //---------------------------------------------

            before: function () {
                this.options.controller.beforeRoute();
            }
        });
    });

    return TasksRouter;
});

