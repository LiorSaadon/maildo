define(function (require) {
    "use strict";

    var app = require("mbApp");
    var mailsList = require('json!assets-data/mails.json');
    var contactsList = require('json!assets-data/contacts.json');

    var PreliminaryDataController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        PreliminaryDataController = Marionette.Controller.extend({

            setData:function(){
                this.localStorage = window.localStorage;

                this.setMails();
                this.setContacts();
            },

            //------------------------------------------------------------------------

            setMails:function(){
                if(_.isNull(this.localStorage.getItem('mails'))){
                    this.localStorage.setItem('mails', JSON.stringify(mailsList));
                }
            },

            //-------------------------------------------------------------------------

            setContacts: function () {
                if(_.isNull(this.localStorage.getItem('contacts'))){
                    this.localStorage.setItem('contacts', JSON.stringify(contactsList));
                }
            }
        });
    });

    return PreliminaryDataController;
});