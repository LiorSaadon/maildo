define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var layoutTemplate = require("tpl!mail-templates/dataLayout.tmpl");

    var DataLayout = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        DataLayout = Marionette.Layout.extend({
            template:layoutTemplate,
            regions:{
                itemsRegion:".mail-items-region",
                previewRegion:".mail-preview-region",
                messageBoard:".mail-message-region"
            }
        });
    });

    return DataLayout;
});