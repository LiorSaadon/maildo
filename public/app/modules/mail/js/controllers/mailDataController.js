define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailCollection = require("mail-collections/mailCollection");
    var SelectableDecortator = require("assets-base-objects/collections/selectableCollectionDecorator");

    var DataController = {};

    app.module('mail', function (mail, mbApp, Backbone, Marionette, $, _) {

        DataController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = new SelectableDecortator(new MailCollection());
                //setTimeout(this.mails.persist, 15000);

                //load userCollection without waiting

            },

            getMailCollection : function () {
                return this.mails;
            }
        });
    });
    return DataController;
});


