"use strict";

var app = require("app");
var Dialog = require("dialog");
var TechBarView = require('frame-views/techBarView');
var LoaderView = require('frame-views/loaderView');
var SettingsView = require('frame-views/settingsView');
var FrameTemplate = require("frame-templates/frameLayout.hbs");

var FrameLayout = Marionette.LayoutView.extend({
    template: FrameTemplate,

    ui: {
        switcherCaption: ".moduleSwitcher .caption",
        techbarWrapper: ".techbar-wrapper",
        loaderWrapper: ".loader-wrapper",
        btnSettings: ".btnSettings"
    },

    regions: {
        settingsRegion: ".settings-region",
        searchRegion: ".search-region",
        actionsRegion: ".actions-region",
        mainRegion: ".main-region"
    },

    events: {
        "click @ui.btnSettings": "openSettings"
    },

    //---------------------------------------------------------

    onRender: function () {

        var techBarView = new TechBarView({
            el: this.ui.techbarWrapper
        });
        techBarView.render();

        var loaderView = new LoaderView({
            el: this.ui.loaderWrapper
        });
        loaderView.render();
    },

    //-------------------------------------------------------

    openSettings: function () {

        var settingsView = new SettingsView({
            model: app.settings
        });

        var dialog = new Dialog({
            el: this.el,
            title: app.translator.translate("frame:settings"),
            insideView: settingsView
        });
        dialog.show();
    },

    //-------------------------------------------------------

    onModuleChange: function () {
        this.ui.switcherCaption.html(app.translator.translate("frame:module." + app.context.get("module")));
    }
});

module.exports = FrameLayout;

