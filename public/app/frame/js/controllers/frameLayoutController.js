define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var FrameLayout = require('frame-views/frameLayout');
    var TechBarView = require('frame-views/techBarView');
    var LayoutHelpers = require("assets-resolvers-ui/dropdownDisplayer");

    var LayoutController = Marionette.Controller.extend({

        currSubLayout: "",

        //---------------------------------------------------
        // initialize
        //---------------------------------------------------

        initialize: function (options) {

            this.frameLayout = new FrameLayout();
        },

        //---------------------------------------------------
        // setLayout
        //---------------------------------------------------

        setLayout: function (mainRegion) {

            this.listenTo(this.frameLayout, "render", this.onLayoutRender);
            mainRegion.show(this.frameLayout);
        },

        //---------------------------------------------------

        onLayoutRender: function () {

            var techBarView = new TechBarView();
            this.frameLayout.techbar.show(techBarView);
        },

        //---------------------------------------------------
        // changeSubLayout
        //---------------------------------------------------

        changeSubLayout: function(moduleName){

            if(this.currSubLayout !== moduleName){

                var newLayout = app.module(moduleName).getLayout();
                this.frameLayout.main.show(newLayout);
                this.currSubLayout = moduleName;
            }
        }
    });

    return LayoutController;
});