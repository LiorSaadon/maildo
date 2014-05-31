define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ContactsStorage = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ContactsStorage = function (_orderBy) {

            var _localStorage = window.localStorage;

            //----------------------------------------------------
            // findAll
            //----------------------------------------------------

            var findAll = function (model,options) {

                var contacts = _localStorage.getItem('contacts');
                return _.isString(contacts) ? JSON.parse(contacts) : [];
            };

            return{
                findAll: findAll
            };
        };
    });

    return ContactsStorage;
});