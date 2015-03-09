define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!mail-templates/mainLayout.tmpl");

    var MailLayout = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

       MailLayout = Marionette.LayoutView.extend({
            template:layoutTemplate,
            isPermanent:true,
            regions:{
                navRegion:".mail-nav-region",
                workRegion:".mail-work-region"
            }
        });
    });

    return MailLayout;
});