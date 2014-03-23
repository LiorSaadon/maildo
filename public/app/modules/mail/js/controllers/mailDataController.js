define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailCollection = require("mail-collections/mailCollection");
    var ContactsCollection = require("mail-collections/contactsCollection");
    var SelectableDecortator = require("common-decorators/selectableCollectionDecorator");
    var PreliminaryDataController = require("mail-controllers/preliminaryDataController");

    var DataController = {};

    app.module('mail', function (mail, mbApp, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.preliminaryDataController = new PreliminaryDataController();
                this.preliminaryDataController.setData();

                this.mails = new SelectableDecortator(new MailCollection());

                this.contactsCollection = new ContactsCollection();
                this.contactsCollection.fetch();
            },

            //------------------------------------------------------

            getMailCollection : function () {
                return this.mails;
            },

            //------------------------------------------------------

            getContactsCollection: function(){
               return this.contactsCollection;
            }
        });
    });
    return DataController;
});


