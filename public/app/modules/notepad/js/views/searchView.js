define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!notepad-templates/searchView.tmpl");

    var SearchView = {};

    app.module('notepad', function (mail, app,  Backbone, Marionette, $, _) {

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
                this.listenTo(app.context, 'change:notepad.action', this.onActionChange, this);
            },

            //-----------------------------------------------

            onActionChange:function(){

                var action = app.context.get("notepad.action.type");

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