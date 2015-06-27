"use strict";

var template = require("frame-templates/techBar.hbs");

var TechBarView = Marionette.ItemView.extend({
    template: template,

    ui: {
        ddsResources: ".ddsResources"
    },

    events: {
        "click .ddsResources": "onResourcesMenuClick"
    },

    onResourcesMenuClick: function (e) {
        e.stopPropagation();
    }
});

module.exports = TechBarView;
