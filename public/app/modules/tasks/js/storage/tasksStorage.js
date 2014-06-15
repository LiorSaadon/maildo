define(function (require) {
    "use strict";

    var app = require("mbApp");

    var TasksStorage = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksStorage = function () {

            var _localStorage = window.localStorage;

            //------------------------------------------------
            // findAll
            //------------------------------------------------

            var findAll = function (model, options) {

                var store = _localStorage.getItem('taskCategories');

                return {
                    collection: _.isString(store) ? JSON.parse(store) : []
                };
            };

            return{
                findAll: findAll
            };
        };

    });

    return TasksStorage;
});