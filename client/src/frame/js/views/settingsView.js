"use strict";

var app = require("app");
var template = require("frame-templates/settingsView.hbs");

var SettingsView = Marionette.ItemView.extend({
    template: template,

    ui: {
        btnDark: ".darkTheme",
        btnDust: ".dustTheme",
        ddlLang: ".language-box"
    },

    events: {
        "click .themeBox": "onThemeClick",
        "change @ui.ddlLang": "onLanguageChange"
    },

    //----------------------------------------------------------------------

    onRender: function () {

        this.ui.ddlLang.val(app.settings.get("lang"));
    },

    //----------------------------------------------------------------------

    onLanguageChange: function () {

        var lang = this.ui.ddlLang.val();

        app.settings.set("lang", lang);
        app.settings.save(null, {
            success: function () {
                location.reload(true);
            }
        });
    },

    //----------------------------------------------------------------------

    onThemeClick: function (e) {

        var target = $(e.currentTarget || e.srcElement);
        var theme = target.attr("data-name");

        app.settings.set("theme", theme);
        app.settings.save(null, {
            success: function () {
                app.settingsController._loadTheme();
            }
        });
    }
});

module.exports = SettingsView;
