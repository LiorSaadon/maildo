define(function (require) {
    "use strict";

    var app = require("mbApp");

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
            }
        });
    });
    return TasksRouterController;
});
