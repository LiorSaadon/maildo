define(function (require) {
    "use strict";

    var app = require("mbApp");
    var CategoryModel = require("tasks-models/categoryModel");
    var Storage = require("tasks-storage/tasksCategoriesStorage");
    var BaseCollection = require("assets-collections/BaseCollection");

    var MailCollection = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MailCollection = BaseCollection.extend({

            isFetched: false,

            model: CategoryModel,

            localStorage: new Storage()
        });
    });
    return MailCollection;
});
