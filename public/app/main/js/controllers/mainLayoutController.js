define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var MainLayout = require('main-views/mainLayout');
    var TechBarView = require('main-views/techBarView');
    var LayoutHelpers = require("assets-resolvers-ui/dropdownDisplayer");

    var LayoutController = Marionette.Controller.extend({

        currSubLayout: "",

        //---------------------------------------------------
        // initialize
        //---------------------------------------------------

        initialize: function (options) {

            this.mainLayout = new MainLayout();
        },

        //---------------------------------------------------
        // setLayout
        //---------------------------------------------------

        setLayout: function (mainRegion) {

            this.listenTo(this.mainLayout, "render", this.onLayoutRender);
            mainRegion.show(this.mainLayout);
        },

        //---------------------------------------------------

        onLayoutRender: function () {

            var techBarView = new TechBarView();
            this.mainLayout.techbar.show(techBarView);
        },

        //---------------------------------------------------
        // changeSubLayout
        //---------------------------------------------------

        changeSubLayout: function(moduleName){

            if(this.currSubLayout !== moduleName){

                var newLayout = app.module(moduleName).getLayout();
                this.mainLayout.main.show(newLayout);
                this.currSubLayout = moduleName;
            }
        }
    });

    return LayoutController;
});