define(function (require) {
    "use strict";

    var app = require("mbApp");
    var notebooks = require('json!notepad-data/notebooks.json');
    var notes = require('json!notepad-data/notes.json');

    var PreliminaryDataController = {};

    app.module('mail', function (notepad, app, Backbone, Marionette, $, _) {

        PreliminaryDataController = Marionette.Controller.extend({

            setData:function(){
                this.localStorage = window.localStorage;

                this.setNotebooks();
                this.setNotes();
            },

            //------------------------------------------------------------------------

            setNotebooks:function(){
                if(_.isNull(this.localStorage.getItem('notebooks'))){
                    this.localStorage.setItem('notebooks', JSON.stringify(notebooks));
                }
            },

            //------------------------------------------------------------------------

            setNotes:function(){
                if(_.isNull(this.localStorage.getItem('notes'))){
                    this.localStorage.setItem('notes', JSON.stringify(notes));
                }
            }
        });
    });

    return PreliminaryDataController;
});