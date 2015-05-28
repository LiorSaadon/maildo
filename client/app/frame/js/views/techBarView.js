//http://cssmenumaker.com/menu/jquery-accordion-menu#

define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!frame-templates/techBar.tmpl");

    var TechBarView = Marionette.ItemView.extend({
        template:template,

        initialize:function (options) {
        },

        onRender: function () {
        }
    });

    return TechBarView;
});