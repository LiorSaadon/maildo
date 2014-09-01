define(function (require) {
    "use strict";

    var app = require("mbApp");
    var CategoriesStorage = require("tasks-storage/categoriesStorage");
    var ChangesDetector = require("assets-resolvers-storage/localStorageChangesDetector");

    var TasksStorage = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksStorage = (function () {

            var _localStorage = window.localStorage;
            var categoriesStorage = new CategoriesStorage();

            //------------------------------------------------
            // findAll
            //------------------------------------------------

            var findAll = function (model, options) {

                var tasks = getTasks(),
                    data = options.data || {};

                var categoryId = data.filters ? data.filters.categoryId : null;

                if(!_.isFinite(categoryId)){
                    categoryId = categoriesStorage.getDefaultCategoryId();
                }

                var result = _.where(tasks, {category:categoryId});
                var changed = ChangesDetector.detect(result, model.url(), {"query":"categoryId:"+categoryId});

                if (data.persist && !changed) {
                    return {
                        metadata: {status: 'nochange'},
                        collection: []
                    };
                }
                return{
                    metadata: {categoryId: categoryId},
                    collection:result
                };
            };

            //------------------------------------------------
            // getRecords
            //------------------------------------------------

            var getTasks = function () {

                var store = _localStorage.getItem('tasks');
                return _.isString(store) ? JSON.parse(store) : [];
            };

            return{
                findAll: findAll
            };
        })();
    });

    return TasksStorage;
});