define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/searchView.tmpl");

    var SearchView = {};

    app.module('tasks', function (tasks, app,  Backbone, Marionette, $, _) {

        SearchView = Marionette.ItemView.extend({
            template:template,
            className:"searchPanel",

            ui: {
                btnSearch: ".btnSearch",
                inputSearch: ".inputSearch"
            },

            events: {
                "click .btnSearch": "onSearchClick"
            },

            //-----------------------------------------------

            initialize:function(){
                this.listenTo(app.context, 'change:tasks.action', this.onActionChange, this);
            },

            //-----------------------------------------------

            onActionChange:function(){

                var action = app.context.get("tasks.action.type");

                if(action !== "search"){
                   this.ui.inputSearch.val('');
                }
            },

            //-----------------------------------------------

            onSearchClick:function(){

            }
        });
    });

    return SearchView;
});