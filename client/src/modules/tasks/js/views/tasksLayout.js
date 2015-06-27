define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!tasks-templates/tasksLayout.tmpl");

    var TasksLayout = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TasksLayout = Marionette.LayoutView.extend({
            template:layoutTemplate,
            regions:{
                categoriesRegion:".tasks-categories-region",
                tasksRegion:".tasks-region",
                taskDetailRegion:".task-info-region"
            },
            initialize:function(){
                this.isPermanent = true;
            }
        });
    });

    return TasksLayout;
});