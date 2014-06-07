define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-models/baseModel");
    var NotepadStorage = require("notepad-storage/notepadStorage");

    var NotebookModel = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        NotebookModel = BaseModel.extend({

            defaults: {
                title:""
            },

            initialize: function (attrs, options) {

                this.localStorage = new NotepadStorage();
            }
        });
    });
    return NotebookModel;
});
