define(function (require) {
    "use strict";

    var app = require("mbApp");
    var categoryList = require('json!tasks-data/categories.json');
    var taskList = require('json!tasks-data/tasks.json');

    var PreliminaryDataController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        PreliminaryDataController = Marionette.Controller.extend({

            setData:function(){
                this.localStorage = window.localStorage;

                this.setCategories();
                this.setTasks();
            },

            //------------------------------------------------------------------------

            setCategories:function(){
                if(_.isNull(this.localStorage.getItem('tasksCategories'))){
                    this.localStorage.setItem('tasksCategories', JSON.stringify(categoryList));
                }
            },

            //------------------------------------------------------------------------

            setTasks:function(){
                if(_.isNull(this.localStorage.getItem('tasks'))){
                    this.localStorage.setItem('tasks', JSON.stringify(taskList));
                }
            }
        });
    });

    return PreliminaryDataController;
});