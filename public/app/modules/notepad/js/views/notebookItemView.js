define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!notepad-templates/notebookItemView.tmpl");

    var NotepadItemView = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        NotepadItemView = Marionette.ItemView.extend({
            template: template,
            tagName: 'li',

            initialize:function(){
            },

            onRender:function(){
            }
        });
    });
    return NotepadItemView;
});