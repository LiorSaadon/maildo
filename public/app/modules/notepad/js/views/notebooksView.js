define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!notepad-templates/notebooksView.tmpl");
    var NotebookItemView = require("notepad-views/notebookItemView");

    var NotebooksView = {};

    app.module('notepad', function (notepad, app,  Backbone, Marionette, $, _) {

        NotebooksView = Marionette.CompositeView.extend({
            name:'notebooks',
            template : template,
            itemView : NotebookItemView,
            itemViewContainer : "ul",

            initialize:function(){
            },

            onRender:function(){
            }
        });
    });
    return NotebooksView;
});