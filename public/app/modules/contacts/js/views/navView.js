define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!contacts-templates/navView.tmpl");

    var NavView = Marionette.CompositeView.extend({
        template:template,

        initialize:function (options) {
        }
    });

    return NavView;
});