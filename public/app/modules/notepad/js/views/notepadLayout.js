define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!notepad-templates/notepadLayout.tmpl");

    var NotepadLayout = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        NotepadLayout = Marionette.Layout.extend({
            template:layoutTemplate,
            regions:{
                notebooksRegion:".notebooks-region",
                notesRegion:".notes-region",
                noteInfoRegion:".note-info-region"
            },
            initialize:function(){
                this.isPermanent = true;
            }
        });
    });

    return NotepadLayout;
});