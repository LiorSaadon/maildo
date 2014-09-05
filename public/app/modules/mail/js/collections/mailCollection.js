define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var MailStorage = require("mail-storage/mailStorage");
    var PersistentCollection = require("assets-collections/PersistentCollection");

    var MailCollection = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailCollection = PersistentCollection.extend({

            isFetched: false,

            model: MailModel,

            resource: 'https://mailbone.com/mails',

            localStorage: new MailStorage(),

            //--------------------------------------------------

            url: function () {

                return this.resource;
            },

            //--------------------------------------------------

            comparator: function (model) {
                return -(new Date(model.get("sentTime")).getTime());
            },

            //--------------------------------------------------

            filterByLabel: function (label) {

                var filtered = [];

                if(_.isString(label)){

                    filtered = _.filter(this.models, function (model) {
                        return !!model.get("labels."+label);
                    });
                }

                return filtered;
            }
        });
    });
    return MailCollection;
});
