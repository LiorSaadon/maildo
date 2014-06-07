define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var template = require("tpl!notepad-templates/actionView.tmpl");

    var ActionView = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {
        ActionView = Marionette.ItemView.extend({
            template: template,
            className: 'actionView'
        });
    });

    return ActionView;
});