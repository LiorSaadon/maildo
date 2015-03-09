define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");

    var MailCollection = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailCollection = Backbone.Collection.extend({

            isFetched: false,

            model: MailModel,

            resource: 'http://localhost:3000/mails',

            //--------------------------------------------------

            url: function () {

                return this.resource;
            }
        });
    });
    return MailCollection;
});
