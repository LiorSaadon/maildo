define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var layoutTemplate = require("tpl!contacts-templates/contactsLayout.tmpl");

    var MailLayout = Marionette.Layout.extend({
        template:layoutTemplate,
        regions:{
            actionRegion:".contacts-action-region",
            navRegion:".contacts-nav-region",
            dataRegion:".contacts-data-region"
        },
        initialize:function(){
            this.isPermanent = true;
        }
    });

    return MailLayout;
});