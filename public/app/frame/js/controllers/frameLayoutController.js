define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var Marionette = require('marionette');
    var FrameLayout = require('frame-views/frameLayout');
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

        },

        //----------------------------------------------------
        // getRegions
        //----------------------------------------------------

        setRegion:function(regionName, view){

            if(this.frameLayout[regionName+"Region"]){
                if(!_.isEmpty(view)){
                    this.frameLayout[regionName+"Region"].show(view);
                }
            }
        }
    });

    return LayoutController;
});