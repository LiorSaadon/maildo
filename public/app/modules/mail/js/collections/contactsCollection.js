define(function (require) {
    "use strict";

    var app = require("mbApp");
    var ContactModel = require("mail-models/contactModel");
    var ContactsFilterModel = require("mail-models/contactsFilterModel");
    var urlResolver = require("assets-resolvers-url/urlResolver");
    var ContactsStorage = require("mail-storage/contactsStorage");
    var BaseCollection = require("assets-collections/BaseCollection");

    var ContactsCollection = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ContactsCollection = Backbone.Collection.extend({

            isFetched:false,

            model: ContactModel,

            filterModel: new ContactsFilterModel(),

            localStorage: new ContactsStorage(),

            url: function() {

                return 'https://mailbone.com/contacts';
            },

            getTitle:function(address){
                var contact = this.find(function(item){
                    return item.get('address') === address;
                });

                if(_.isObject(contact)){
                     return contact.get("title");
                }
                return address;
            }
        });
    });
    return ContactsCollection;
});
