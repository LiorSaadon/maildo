define(function (require) {
    "use strict";

    var app = require("mbApp");

    var TasksCategoriesStorage = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksCategoriesStorage = function () {

            var _localStorage = window.localStorage;

            //------------------------------------------------
            // findAll
            //------------------------------------------------

            var findAll = function (model, options) {

                var store = _localStorage.getItem('tasksCategories');

                return {
                    collection: _.isString(store) ? JSON.parse(store) : []
                };
            };

            return{
                findAll: findAll
            };
        };

    });

    return TasksCategoriesStorage;
});