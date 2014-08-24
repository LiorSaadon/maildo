define(function (require) {
    "use strict";

    var app = require("mbApp");
    var ContactModel = require("mail-models/contactModel");
   // var ContactsFilterModel = require("mail-models/contactsFilterModel");
    var urlResolver = require("assets-resolvers-url/urlResolver");
    var ContactsStorage = require("mail-storage/contactsStorage");
    var BaseCollection = require("assets-collections/BaseCollection");

    var ContactsCollection = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ContactsCollection = Backbone.Collection.extend({

            isFetched:false,

            model: ContactModel,

            localStorage: new ContactsStorage(),

            //-----------------------------------------------------------------

            getTitle:function(address){

                var model = _.find(this.models,function (record) {
                    return record.get("address") === address;
                });

                return model ?  model.get("title") : address;
            },

            //-----------------------------------------------------------------

            getTitles:function(addressList){

                var res = [];

                _.each(addressList, _.bind(function(address){
                    res.push(this.getTitle(address));
                },this));

                return res;
            }
        });
    });
    return ContactsCollection;
});
