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

            url: function() {

                return 'https://mailbone.com/contacts';
            },

            //-----------------------------------------------------------------

            getTitles:function(addressList){

                var that = this, res = [];

                _.each(addressList, function(address){

                    var model = _.find(that.models,function (record) {
                        return record.get("address") === address;
                    });
                    if(model){
                        res.push(model.get("title"));
                    }else{
                        res.push(address);
                    }
                });
                return res;
            }
        });
    });
    return ContactsCollection;
});
