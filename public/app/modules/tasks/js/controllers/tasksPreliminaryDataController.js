define(function (require) {
    "use strict";

    var app = require("mbApp");
    var categoryList = require('json!tasks-data/categories.json');
    var taskList = require('json!tasks-data/tasks.json');

    var PreliminaryDataController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        PreliminaryDataController = (function(){

            var localStorage = window.localStorage;

            //------------------------------------------------------------------------

            var setCategories =function(){
                if(_.isNull(localStorage.getItem('tasksCategories'))){
                    localStorage.setItem('tasksCategories', JSON.stringify(categoryList));
                }
            };

            //------------------------------------------------------------------------

            var setTasks = function(){
                if(_.isNull(localStorage.getItem('tasks'))){
                    localStorage.setItem('tasks', JSON.stringify(taskList));
                }
            };

            //------------------------------------------------------------------------

            setCategories();
            setTasks();
        })();
    });

    return PreliminaryDataController;
});