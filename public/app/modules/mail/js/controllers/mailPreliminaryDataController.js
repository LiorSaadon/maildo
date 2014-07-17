define(function (require) {
    "use strict";

    var app = require("mbApp");
    var mailsList = require('json!assets-data/mails.json');
    var contactsList = require('json!assets-data/contacts.json');

    var PreliminaryDataController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        PreliminaryDataController = (function(){

            var localStorage = window.localStorage;

            //------------------------------------------------------------------------

            var setMails = function(){
                if(_.isNull(localStorage.getItem('mails'))){
                    localStorage.setItem('mails', JSON.stringify(mailsList));
                }
            };

            //-------------------------------------------------------------------------

            var setContacts = function () {
                if(_.isNull(localStorage.getItem('contacts'))){
                    localStorage.setItem('contacts', JSON.stringify(contactsList));
                }
            }

            //------------------------------------------------------------------------

            setMails();
            setContacts();
        })();
    });

    return PreliminaryDataController;
});