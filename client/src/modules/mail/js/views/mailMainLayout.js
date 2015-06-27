"use strict";

var app = require("app");
var layoutTemplate = require("mail-templates/mainLayout.hbs");

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

module.exports = MailLayout;
