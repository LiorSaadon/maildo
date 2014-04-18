define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/previewView.tmpl");

    var PreviewView = {};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

        PreviewView = Marionette.ItemView.extend({
            template:template
        });
    });

    return PreviewView;
});