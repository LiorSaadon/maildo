define(function (require) {
    "use strict";

    var app = require("mbApp");
    var eModules = require('json!assets-data/eModules.json');

    var TasksRouterController = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksRouterController = Marionette.Controller.extend({


            //-----------------------------------------------------------------
            //  actions
            //-----------------------------------------------------------------

            tasks:function(){
                app.context.set("tasks.action",{'type':'tasks'});
            },

            newTask:function(){
                app.context.set("tasks.action",{'action':'newTask'});
            },

            //-----------------------------------------------------------------
            // beforeRoute
            //-----------------------------------------------------------------

            beforeRoute:function(){

                app.context.set("module",eModules.TASKS);
            }
        });
    });
    return TasksRouterController;
});
