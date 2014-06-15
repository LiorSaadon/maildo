define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("tasks-views/tasksLayout");
    var SearchView = require("tasks-views/searchView");
    var ActionView = require("tasks-views/actionView");
    var CategoriesView = require("tasks-views/categoriesView");

    var MainLayoutController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.searchView = new SearchView();
                this.mainLayout = new MainLayout();
                this.actionView = new ActionView();

                this.listenTo(app.context, 'change:module', this.setViews, this);
                this.listenTo(app.context, 'change:tasks.action', this.onActionChange, this);
                this.listenTo(this.mainLayout, "render", this.onMainLayoutRender, this);
            },

            //----------------------------------------------------
            // setViews
            //----------------------------------------------------

            setViews: function () {

                if(app.context.get("module") === "tasks"){

                    app.frame.setRegion("search", this.searchView);
                    app.frame.setRegion("actions", this.actionView);
                    app.frame.setRegion("main", this.mainLayout);
                }
            },

            //----------------------------------------------------

            onMainLayoutRender:function(){

                this.categories = tasks.dataController.getCategoriesCollection();

                this.categories.fetch({
                    success: _.bind(function () {
                        var categoriesView = new CategoriesView({collection: this.categories});
                        this.mainLayout.categoriesRegion.show(categoriesView);
                    }, this)
                });
            },

            onActionChange:function(){

            }
        });
    });
    return MainLayoutController;
});
