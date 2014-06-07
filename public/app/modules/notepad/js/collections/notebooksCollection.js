define(function (require) {
    "use strict";

    var app = require("mbApp");
    var NotebookModel = require("notepad-models/notebookModel");
    var NotepadStorage = require("notepad-storage/notepadStorage");
    var BaseCollection = require("assets-collections/BaseCollection");

    var MailCollection = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        MailCollection = BaseCollection.extend({

            isFetched: false,

            model: NotebookModel,

            localStorage: new NotepadStorage()
        });
    });
    return MailCollection;
});
