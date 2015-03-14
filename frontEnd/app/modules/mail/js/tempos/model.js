define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var BaseModel = require("assets-base-models/baseModel");

    var MailModel = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({

            defaults: {
                from: '',
                to: '',
                cc: '',
                bcc: '',
                subject: '',
                sentTime: '',
                body: '',
                labels: {},
                groups:{}
            },

            resource: 'addItem',

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
    return MailModel;
});