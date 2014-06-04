define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");
    var TechBarView = require('frame-views/techBarView');

    var FrameLayout = Marionette.Layout.extend({
        template:frameTemplate,
        ui:{
            techbarWrapper:".techbar-wrapper"
        },
        regions:{
            searchRegion:".search-region",
            actionsRegion:".actions-region",
            mainRegion:".main-region"
        },

        initialize:function(){

        },

        onRender:function(){
            var techBarView = new TechBarView({
                el: this.ui.techbarWrapper
            });
            techBarView.render();
        }
    });

    return FrameLayout;
});
