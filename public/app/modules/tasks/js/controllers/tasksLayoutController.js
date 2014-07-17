define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("tasks-views/tasksLayout");
    var SearchView = require("tasks-views/searchView");
    var ActionView = require("tasks-views/actionView");
    var TasksTableView = require("tasks-views/tasksTableView");
    var CategoriesView = require("tasks-views/categoriesView");
    var eModules = require('json!assets-data/eModules.json');

    var MainLayoutController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.listenTo(tasks.vent, "category:item:click", this.showCategoryTasks);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

                this.searchView = new SearchView();
                this.mainLayout = new MainLayout();
                this.actionView = new ActionView();

                this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);

                app.frame.setRegion("search", this.searchView);
                app.frame.setRegion("actions", this.actionView);
                app.frame.setRegion("main", this.mainLayout);

                return true;
            },

            //----------------------------------------------------

            onMainLayoutRender: function () {

                var categories = tasks.dataController.categories;
                var selected = categories.models[0];

                var categoriesView = new CategoriesView({collection: categories, selectedId: selected.cid});
                this.mainLayout.categoriesRegion.show(categoriesView);

                this.showCategoryTasks(selected.id);
            },

            //----------------------------------------------------

            showCategoryTasks: function (categoryId) {

                this.tasksCollection = tasks.dataController.tasksCollection;

                this.tasksCollection.fetchBy({
                    filters: {
                        categoryId: categoryId
                    },
                    success: _.bind(function () {
                        var tasksCollection = new TasksTableView({collection: this.tasksCollection});
                        this.mainLayout.tasksRegion.show(tasksCollection);
                    }, this)
                });
            }
        });
    });
    return MainLayoutController;
});
