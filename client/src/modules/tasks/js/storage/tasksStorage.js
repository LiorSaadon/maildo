define(function (require) {
    "use strict";

    var app = require("mbApp");
    var CategoriesStorage = require("tasks-storage/categoriesStorage");
    var ChangesDetector = require("resolvers/storage/localStorageChangesDetector");

    var TasksStorage = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksStorage = (function () {

            var _localStorage = window.localStorage;
            var categoriesStorage = new CategoriesStorage();


            //-------------------------------------------------
            // create
            //-------------------------------------------------

            var create = function (model) {

                if (_.isObject(model)) {

                    model = model.toJSON();

                    var tasks = getTasks();

                    if (!model.id) {
                        model.id = _.uniqueId('_');
                        model.idAttribute = model.id;
                    }
                    tasks.unshift(model);
                    _localStorage.setItem('tasks', JSON.stringify(tasks));

                    return {id:model.id};
                }

                return {status: "error", message: 'model not valid'};
            };

            //-------------------------------------------------
            // update
            //-------------------------------------------------

            var update = function (_model) {

                if (_.isObject(_model)) {

                    var model = _model.toJSON();

                    var tasks = getTasks();

                    var task = _.find(tasks, function (record) {
                        return record.id == model.id;
                    });

                    if (task) {

                        task.title =  model.title;
                        task.content = model.content;

                        _localStorage.setItem('tasks', JSON.stringify(tasks));
                        return {id:model.id};
                    }
                }
                return {status: "error", message: 'model not valid'};
            };

            //-------------------------------------------------
            // destroy function
            //-------------------------------------------------

            var destroy = function (model, options) {

                if(_.isObject(model)){
                    var tasks = getTasks();

                    var filtered = _.reject(tasks, function(record){
                        return record.id === model.id;
                    });

                    if (!_.isUndefined(filtered)) {
                        _localStorage.setItem('tasks', JSON.stringify(filtered));
                    }
                }
                return {res:[]};
            };


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

                var result = _.where(tasks, {categoryId:categoryId});
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
            // getTasks
            //------------------------------------------------

            var getTasks = function () {

                var store = _localStorage.getItem('tasks');
                return _.isString(store) ? JSON.parse(store) : [];
            };

            return{
                create: create,
                update: update,
                destroy: destroy,
                findAll: findAll
            };
        })();
    });

    return TasksStorage;
});