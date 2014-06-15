define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-models/baseModel");
    var TasksStorage = require("tasks-storage/tasksStorage");

    var TaskModel = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskModel = BaseModel.extend({

            defaults: {
                title:""
            },

            initialize: function (attrs, options) {
                this.localStorage = new TasksStorage();
            }
        });
    });
    return TaskModel;
});