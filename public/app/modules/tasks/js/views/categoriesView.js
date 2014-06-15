define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/categoriesView.tmpl");
    var CategoryItemView = require("tasks-views/categoryItemView");

    var CategoriesView = {};

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        CategoriesView = Marionette.CompositeView.extend({
            name:'tasks-categories',
            template : template,
            itemView : CategoryItemView,
            itemViewContainer : "ul",

            initialize:function(){
            },

            onRender:function(){
            }
        });
    });
    return CategoriesView;
});