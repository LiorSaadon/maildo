define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");
    var TechBarView = require('frame-views/techBarView');

    var FrameLayout = Marionette.Layout.extend({
        template:frameTemplate,

        ui:{
            switcherCaption:".moduleSwitcher .caption",
            techbarWrapper:".techbar-wrapper"
        },

        regions:{
            searchRegion:".search-region",
            actionsRegion:".actions-region",
            mainRegion:".main-region"
        },

        initialize:function(){
            this.listenTo(app.context, 'change:module', this.onModuleChange, this);
        },

        onRender:function(){
            var techBarView = new TechBarView({
                el: this.ui.techbarWrapper
            });
            techBarView.render();
        },

        onModuleChange:function(){
            this.ui.switcherCaption.html(app.context.get("module"));
        }
    });

    return FrameLayout;
});
