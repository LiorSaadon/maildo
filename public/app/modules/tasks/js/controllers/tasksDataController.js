define(function (require) {
    "use strict";

    var app = require("mbApp");
    var CategoriesCollection = require("tasks-collections/categoriesCollection");
    var PreliminaryDataController = require("tasks-controllers/preliminaryDataController");

    var DataController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.preliminaryDataController = new PreliminaryDataController();
                this.preliminaryDataController.setData();

                this.categories = new CategoriesCollection();
                this.categories.fetch();
            },

            //------------------------------------------------------

            getCategoriesCollection : function () {
                return this.categories;
            }
        });
    });
    return DataController;
});


