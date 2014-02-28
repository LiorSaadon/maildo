define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseModel = require("assets-base-objects/models/baseModel");
    var MailStorage = require("mail-storage");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailModel = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        MailModel = BaseModel.extend({

            filterBy:function(label1,label2){

                this.removeLabel(label1);
                this.addLabel(label2);
            }
        });
    });
    return MailModel;
});