define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailsView = require("mail-views/mailsView");

    var LayoutController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        LayoutController = Marionette.Controller.extend({

            initialize: function () {

            },

            //-----------------------------------------------------

            _bindEvents: function () {

            },

            //----------------------------------------------------
            // newLayout
            //----------------------------------------------------

            newLayout: function () {
               return new MailsView();
            }
        });
    });
    return LayoutController;
});
