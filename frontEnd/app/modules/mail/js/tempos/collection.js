define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var BaseCollection = require("assets-base-collections/BaseCollection");

    var MailCollection = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailCollection = BaseCollection.extend({

            isFetched: false,

            model: MailModel,

            resource: 'mails',

            initialize: function (attrs, options) {

                options = options || {};

                this.socket = {
                    requestName: this.resource,
                    io: options.socket || mail.socket || app.socket
                };
            },

            //--------------------------------------------------

            url: function () {
                return window.location.hostname + "/" + this.resource;
            }
        });
    });
    return MailCollection;
});
