define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!contacts-templates/actionView.tmpl");

    var ActionView = Marionette.CompositeView.extend({
        template:template,

        initialize:function (options) {
        }
    });

    return ActionView;
});