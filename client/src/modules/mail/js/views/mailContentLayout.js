"use strict";

var app = require("app");
var layoutTemplate = require("mail-templates/contentLayout.hbs");

var ContentLayout = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    ContentLayout = Marionette.LayoutView.extend({
        template: layoutTemplate,
        isPermanent: true,
        regions: {
            itemsRegion: ".mail-items-region",
            previewRegion: ".mail-preview-region",
            messageBoard: ".mail-message-board-region"
        }
    });
});

module.exports = ContentLayout;
