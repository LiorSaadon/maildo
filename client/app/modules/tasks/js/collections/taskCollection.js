define(function (require) {
    "use strict";

    var app = require("mbApp");
    var TaskModel = require("tasks-models/taskModel");
    var TasksStorage = require("tasks-storage/tasksStorage");
    var PersistentCollection = require("base-collections/persistentCollection");

    var TaskCollection = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskCollection = PersistentCollection.extend({

            isFetched: false,

            model: TaskModel,

            resource: 'https://mailbone.com/tasks',

            localStorage: TasksStorage,

            url: function () {

                return this.resource;
            }
        });
    });
    return TaskCollection;
});
