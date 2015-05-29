//http://cssmenumaker.com/menu/jquery-accordion-menu#

define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!frame-templates/techBar.tmpl");

    var TechBarView = Marionette.ItemView.extend({
        template:template,

        ui: {
            ddsResources:".ddsResources"
        },

        events: {
            "click .ddsResources": "onResourcesMenuClick"
        },

        onResourcesMenuClick: function (e) {
            e.stopPropagation();
        }
    });

    return TechBarView;
});