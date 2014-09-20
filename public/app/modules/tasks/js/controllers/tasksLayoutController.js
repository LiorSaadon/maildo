define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MainLayout = require("tasks-views/tasksLayout");
    var SearchView = require("tasks-views/searchView");
    var ActionView = require("tasks-views/actionView");
    var TaskDetailsView = require("tasks-views/taskDetailsView");
    var TasksView = require("tasks-views/tasksView");
    var CategoriesView = require("tasks-views/categoriesView");
    var eModules = require('json!common-enums/eModules.json');
    var TaskModel = require("tasks-models/taskModel");

    var MainLayoutController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        MainLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.tasks = tasks.channel.reqres.request("task:collection");
                this.categories = tasks.channel.reqres.request("category:collection");

                this._bindEvents();
            },

            //-----------------------------------------------------

            _bindEvents: function () {

                this.listenTo(this.tasks, "change:items", this.closeTask);
                this.listenTo(tasks.channel.vent, "task:show", this.showTask);
                this.listenTo(tasks.channel.vent, "task:create", this.createTask);
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

                var categoriesView = new CategoriesView({collection: this.categories});
                this.mainLayout.categoriesRegion.add(categoriesView);

                var tasksView = new TasksView({collection: this.tasks});
                this.mainLayout.tasksRegion.add(tasksView);
            },

            //----------------------------------------------------
            // show\close task view
            //----------------------------------------------------

            showTask: function (taskModel) {

                this.taskView = new TaskDetailsView({
                    model: taskModel
                });
                this.mainLayout.taskDetailRegion.add(this.taskView);
            },

            //----------------------------------------------------

            createTask: function () {
                var category = tasks.channel.reqres.request("selected:category");

                if (category) {
                    var taskModel = new TaskModel({"categoryId": category.id});
                    this.showTask(taskModel);
                }
            },

            //----------------------------------------------------

            closeTask: function () {

                if (this.mainLayout && this.taskView && !this.taskView.model.isNew()) {

                    var isModelExist = _.isObject(this.tasks.get(this.taskView.model.id));

                    if (!isModelExist) {
                        this.mainLayout.taskDetailRegion.clean();
                    }
                }
            }
        });
    });
    return MainLayoutController;
});
