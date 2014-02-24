define(function (require) {
    "use strict";

    var Marionette = require('marionette');
    var contacts = require('json!main-data/contacts.json');

    var PreliminaryDataController = Marionette.Controller.extend({

        initialize:function(){
            this.setContacts();
        },

        setContacts: function () {
            var contacts = window.localStorage.getItem('contacts');

            if(_.isUndefined(contacts)){
                window.localStorage.setItem('contacts', JSON.stringify(contacts));
            }
        }
    });

    return PreliminaryDataController;
});