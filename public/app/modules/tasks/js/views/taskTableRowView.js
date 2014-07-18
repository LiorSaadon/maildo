define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/taskTableRowView.tmpl");

    var TaskRowView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskRowView = Marionette.ItemView.extend({
            template: template,
            tagName: 'li',

            triggers: {
               "click": "click"
            },

            initialize:function(){
            },

            onRender:function(){
            }
        });
    });
    return TaskRowView;
});