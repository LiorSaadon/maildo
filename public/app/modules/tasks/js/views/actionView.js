define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var template = require("tpl!tasks-templates/actionView.tmpl");

    var ActionView = {};

    app.module('tasks', function (tasks, app, Backbone, Marionette, $, _) {
        ActionView = Marionette.ItemView.extend({
            template: template,
            className: 'actionView'
        });
    });

    return ActionView;
});