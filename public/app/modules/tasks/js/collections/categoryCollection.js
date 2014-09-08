define(function (require) {
    "use strict";

    var app = require("mbApp");
    var CategoryModel = require("tasks-models/categoryModel");
    var BaseCollection = require("base-collections/BaseCollection");
    var CategoriesStorage = require("tasks-storage/categoriesStorage");

    var CategoryCollection = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        CategoryCollection = BaseCollection.extend({

            isFetched: false,

            model: CategoryModel,

            localStorage: new CategoriesStorage()
        });
    });
    return CategoryCollection;
});
