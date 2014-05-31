define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!mail-templates/mailLayout.tmpl");

    var MailLayout = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

       MailLayout = Marionette.Layout.extend({
            template:layoutTemplate,
            regions:{
                headerRegion:".mail-header-region",
                actionRegion:".mail-action-region",
                navRegion:".mail-nav-region",
                dataRegion:".mail-data-region"
            },
            initialize:function(){
               this.isPermanent = true;
            }
        });
    });

    return MailLayout;
});