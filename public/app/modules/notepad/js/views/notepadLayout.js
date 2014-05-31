define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!notepad-templates/notepadLayout.tmpl");

    var NotepadLayout = {};

    app.module('notepad', function (notepad, app,  Backbone, Marionette, $, _) {

        NotepadLayout = Marionette.Layout.extend({
            template:layoutTemplate,
            regions:{
                headerRegion:".notepad-header-region",
                actionRegion:".notepad-action-region",
                dataRegion:".notepad-data-region"
            },
            initialize:function(){
                this.isPermanent = true;
            }
        });
    });

    return NotepadLayout;
});