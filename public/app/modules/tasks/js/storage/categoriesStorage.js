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

                return {
                    collection:getRecords()
                };
            };

            //------------------------------------------------

            var getDefaultCategoryId = function(){

                var records =  getRecords();

                var record = _.find(records, function (record) {
                    return record.isDefault === true;
                });

                return record.id;
            };

            //------------------------------------------------
            // getRecords
            //------------------------------------------------

            var getRecords = function () {

                var store = _localStorage.getItem('tasksCategories');
                return _.isString(store) ? JSON.parse(store) : [];
            };

            return{
                findAll: findAll,
                getDefaultCategoryId:getDefaultCategoryId
            };
        };

    });

    return TasksCategoriesStorage;
});