define(function (require) {
    "use strict";

    var app = require("mbApp");
    var ContactModel = require("main-models/contactModel");
    var ContactsFilterModel = require("main-models/contactsFilterModel");
    var urlResolver = require("assets-resolvers-url/urlResolver");
    var ContactsStorage = require("main-storage/contactsStorage");
    var BaseCollection = require("assets-base-objects/collections/BaseCollection");

    var ContactsCollection = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ContactsCollection = Backbone.Collection.extend({

            isFetched:false,

            model: ContactModel,

            filterModel: new ContactsFilterModel(),

            localStorage: new ContactsStorage(),

            url: function() {

                return 'https://mailbone.com/contacts';
            }
        });
    });
    return ContactsCollection;
});
