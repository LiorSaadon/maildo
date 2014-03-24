define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var urlResolver = require("assets-resolvers-url/urlResolver");
    var MailStorage = require("mail-storage/mailStorage");
    var PersistentCollection = require("assets-collections/PersistentCollection");

    var MailCollection = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        MailCollection = PersistentCollection.extend({

            isFetched:false,

            model: MailModel,

            resource: 'https://mailbone.com/mails',

            localStorage: new MailStorage(),

            //--------------------------------------------------

            url: function() {

                return urlResolver.getUrl(this.resource);
            },

            //--------------------------------------------------

            comparator: function(model) {
                return -model.get("sentTime").valueOf();
            }
        });
    });
    return MailCollection;
});
