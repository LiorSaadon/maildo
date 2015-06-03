define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    //var MailStorage = require("mail-storage/mailStorage");
    var FilteredCollection = require("base-collections/filteredCollection");

    var MailCollection = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailCollection = FilteredCollection.extend({

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
