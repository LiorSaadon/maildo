define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!mail-templates/contentLayout.tmpl");

    var ContentLayout = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        ContentLayout = Marionette.LayoutView.extend({
            template:layoutTemplate,
            regions:{
                itemsRegion:".mail-items-region",
                previewRegion:".mail-preview-region",
                messageBoard:".mail-message-board-region"
            }
        });
    });

    return ContentLayout;
});