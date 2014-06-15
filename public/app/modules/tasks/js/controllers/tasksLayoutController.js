define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("tasks-views/tasksLayout");
    var SearchView = require("tasks-views/searchView");
    var ActionView = require("tasks-views/actionView");
    var CategoriesView = require("tasks-views/categoriesView");
    var eModules = require('json!assets-data/eModules.json');

    var MainLayoutController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.searchView = new SearchView();
                this.mainLayout = new MainLayout();
                this.actionView = new ActionView();

                this.listenTo(app.context, 'change:module', this.setViews, this);
                this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

                if(app.context.get("module") === eModules.TASKS){

                    app.frame.setRegion("search", this.searchView);
                    app.frame.setRegion("actions", this.actionView);
                    app.frame.setRegion("main", this.mainLayout);
                }
            },

            //----------------------------------------------------

            onMainLayoutRender:function(){

                this.categories = tasks.dataController.categories;

                this.onCategoryChange(this.categories.models[0].id);
                var categoriesView = new CategoriesView({collection: this.categories});
                this.mainLayout.categoriesRegion.show(categoriesView);
            },

            //----------------------------------------------------

            onCategoryChange:function(categoryId){

                this.tasksCollection = tasks.dataController.tasksCollection;

//                this.tasksCollection.fetch({
//                    categoryId: categoryId,
//                    success: _.bind(function () {
////                        var tasksCollection = new CategoriesView({collection: this.tasksCollection});
////                        this.mainLayout.categoriesRegion.show(tasksCollection);
//                    }, this)
//                });
            }
        });
    });
    return MainLayoutController;
});
