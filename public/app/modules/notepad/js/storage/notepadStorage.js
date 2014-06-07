define(function (require) {
    "use strict";

    var app = require("mbApp");

    var NotepadStorage = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

         NotepadStorage = function () {

            var _localStorage = window.localStorage;

            //------------------------------------------------
            // findAll
            //------------------------------------------------

            var findAll = function (model, options) {

                var store = _localStorage.getItem('notebooks');

                return {
                    collection: _.isString(store) ? JSON.parse(store) : []
                };
            };

            return{
                findAll: findAll
            };
        };

    });

    return NotepadStorage;
});