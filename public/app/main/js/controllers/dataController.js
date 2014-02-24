define(function (require) {
    "use strict";

    var Marionette = require('marionette');
    var preliminaryDataController = require("main-controllers/preliminaryDataController");
    var ContactsCollection = require("app/main/js/collections/contactsCollection");


    var DataController = Marionette.Controller.extend({

        initialize:function(){

            this.contactsCollection = new ContactsCollection();
            this.contactsCollection.fetch();
        }
    });

    return DataController;
});