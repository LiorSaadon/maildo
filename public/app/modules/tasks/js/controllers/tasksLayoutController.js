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
                this.listenTo(tasks.channel.vent, 'category:change', this.closeTask);
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
            },

            //----------------------------------------------------

            onMainLayoutRender: function () {

                var categoriesView = new CategoriesView({collection: tasks.dataController.categoryCollection});
                this.mainLayout.categoriesRegion.add(categoriesView);

                var tasksView = new TasksTableView({collection: tasks.dataController.taskCollection});
                this.mainLayout.tasksRegion.add(tasksView);
            },

            //----------------------------------------------------

            showTask:function(taskModel){

               var taskDetails = new TaskDetailsView({
                   model:taskModel
               });
               this.mainLayout.taskDetailRegion.add(taskDetails);
            },

            //----------------------------------------------------

            createTask:function(){

                var taskModel = new TaskModel({"categoryId":app.context.get("tasks.selectedCategory")});
                this.showTask(taskModel);
            },

            //----------------------------------------------------

            closeTask:function(){
                this.mainLayout.taskDetailRegion.clean();
            }
        });
    });
    return MainLayoutController;
});
