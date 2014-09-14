define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");
    var TechBarView = require('frame-views/techBarView');
    var LoaderView = require('frame-views/loaderView');
   // var SettingsView = require('frame-views/settingsView');

    var FrameLayout = Marionette.LayoutView.extend({
        template:frameTemplate,

        ui:{
            switcherCaption:".moduleSwitcher .caption",
            techbarWrapper:".techbar-wrapper",
            loaderWrapper:".loader-wrapper",
            btnSettings:".btnSettings"
        },

        regions:{
            settingsRegion:".settings-region",
            searchRegion:".search-region",
            actionsRegion:".actions-region",
            mainRegion:".main-region"
        },

        events:{
            "click @ui.btnSettings": "openSettings"
        },

        //---------------------------------------------------------

        onRender:function(){

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

        openSettings:function(){

//             var settingsView = new SettingsView({
//                 model:app.settings
//             });
//
//             Dialog.show({
//                 view:settingsView,
//                 el:this.$el
//             });
        },

        //-------------------------------------------------------

        onModuleChange:function(){
            this.ui.switcherCaption.html(app.translator.translate("mb.module." +app.context.get("module")));
        }
    });

    return FrameLayout;
});
