define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/categoryItemView.tmpl");

    var TaskItemView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {

        TaskItemView = Marionette.ItemView.extend({
            template: template,
            tagName: 'li',

            initialize:function(){
            },

            onRender:function(){
            }
        });
    });
    return TaskItemView;
});