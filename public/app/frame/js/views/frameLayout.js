define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");
    var TechBarView = require('frame-views/techBarView');
    var LoaderView = require('frame-views/loaderView');

    var FrameLayout = Marionette.LayoutView.extend({
        template:frameTemplate,

        ui:{
            switcherCaption:".moduleSwitcher .caption",
            techbarWrapper:".techbar-wrapper",
            loaderWrapper:".loader-wrapper"
        },

        regions:{
            searchRegion:".search-region",
            actionsRegion:".actions-region",
            mainRegion:".main-region"
        },

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

        onModuleChange:function(){
            this.ui.switcherCaption.html(app.translator.translate("mb.module." +app.context.get("module")));
        }
    });

    return FrameLayout;
});
