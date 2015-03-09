define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var BaseModel = require("assets-base-models/baseModel");

    var MailModel = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailModel =Backbone.Model.extend({

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

            resource: 'http://localhost:3000/addItem',

            //--------------------------------------------------

            url: function () {

                return this.resource;
            }
        });
    });
    return MailModel;
});