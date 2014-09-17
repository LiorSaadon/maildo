define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!frame-templates/settingsView.tmpl");

    var SettingsView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        SettingsView = Marionette.ItemView.extend({
            template:template,

            ui: {
                btnDark:".darkTheme",
                btnDust: ".dustTheme",
                ddlLang: ".language-box"
            },

            events: {
                "click .themeBox": "onThemeClick",
                "change @ui.ddlLang": "onLanguageChange"
            },

            //----------------------------------------------------------------------

            onRender:function(){

               this.ui.ddlLang.val(app.settings.get("lang"));
            },

            //----------------------------------------------------------------------

            onLanguageChange:function(e){
                var lang = this.ui.ddlLang.val();

                app.settings.set("lang", lang);
                app.settings.save(null,{
                    success:function(){
                        location.reload(true);
                    }
                });
            },

            //----------------------------------------------------------------------

            onThemeClick:function(e){

                var target = $(e.currentTarget || e.srcElement);
                var theme = target.attr("data-name");

                app.settings.set("theme", theme);
                app.settings.save(null,{
                    success:function(){
                        app.settingsController._loadTheme();
                    }
                });
            }
        });
    });

    return SettingsView;
});