define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("tasks-views/tasksLayout");
    var SearchView = require("tasks-views/searchView");
    var ActionView = require("tasks-views/actionView");
    var TaskDetailsView = require("tasks-views/taskDetailsView");
    var TasksTableView = require("tasks-views/tasksTableView");
    var CategoriesView = require("tasks-views/categoriesView");
    var eModules = require('json!assets-data/eModules.json');
    var TaskModel = require("tasks-models/taskModel");

    var MainLayoutController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.listenTo(tasks.channel.vent, "task:show", this.showTask);
                this.listenTo(tasks.channel.vent, "task:create", this.createTask);
                this.listenTo(tasks.channel.vent, "category:tasks:show", this.showCategoryTasks);
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

                this.currentCategory = categoryId;
                this.tasksCollection = tasks.dataController.tasksCollection;

                this.tasksCollection.fetchBy({
                    filters: {
                        categoryId: this.currentCategory
                    },
                    success: _.bind(function () {
                        var tasksCollection = new TasksTableView({collection: this.tasksCollection});
                        this.mainLayout.tasksRegion.show(tasksCollection);
                        this.mainLayout.taskDetailRegion.empty();
                    }, this)
                });
            },

            //----------------------------------------------------

            showTask:function(taskModel){

               var taskDetails = new TaskDetailsView({
                   model:taskModel
               });
               this.mainLayout.taskDetailRegion.show(taskDetails);
            },

            //----------------------------------------------------

            createTask:function(){

                if(_.isFinite(this.currentCategory)){

                    var taskModel = new TaskModel({"category":this.currentCategory});
                    this.showTask(taskModel)
                }
            }
        });
    });
    return MainLayoutController;
});
