define(function (require) {
    "use strict";

    var app = require("mbApp");
    var NotebooksCollection = require("notepad-collections/notebooksCollection");
    var PreliminaryDataController = require("notepad-controllers/preliminaryDataController");

    var DataController = {};

    app.module('mail', function (notepad, app, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.preliminaryDataController = new PreliminaryDataController();
                this.preliminaryDataController.setData();

                this.notebooks = new NotebooksCollection();
                this.notebooks.fetch();
            },

            //------------------------------------------------------

            getNotebooksCollection : function () {
                return this.notebooks;
            }
        });
    });
    return DataController;
});


