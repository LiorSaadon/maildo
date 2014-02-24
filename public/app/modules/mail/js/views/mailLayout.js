define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var layoutTemplate = require("tpl!mail-templates/mailLayout.tmpl");

    var MailLayout = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

       MailLayout = Marionette.Layout.extend({
            template:layoutTemplate,
            regions:{
                headerRegion:".mail-header-region",
                actionRegion:".mail-action-region",
                navRegion:".mail-nav-region",
                dataRegion:".mail-data-region"
            }
        });
    });

    return MailLayout;
});