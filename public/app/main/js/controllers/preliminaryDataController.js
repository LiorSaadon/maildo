define(function (require) {
    "use strict";

    var Marionette = require('marionette');
    var contactsList = require('json!main-data/contacts.json');

    var PreliminaryDataController = Marionette.Controller.extend({

        setData:function(){
            this.setContacts();
        },

        //-------------------------------------------------------------------------

        setContacts: function () {
            var lsContacts = window.localStorage.getItem('contacts');

            if(_.isNull(lsContacts)){
                window.localStorage.setItem('contacts', JSON.stringify(contactsList));
            }
        }
    });

    return PreliminaryDataController;
});