"use strict";

var app = require('app');
var FrameLayout = require('./js/views/frameLayout');
var LayoutHelpers = require("resolvers/dropdownDisplayer");

var Frame = Marionette.Controller.extend({

    currSubLayout: "",

    //---------------------------------------------------
    // initialize
    //---------------------------------------------------

    initialize: function (options) {

        this.frameLayout = new FrameLayout();
        this.listenTo(app.context, 'change:module', this.changeSublayout, this);
    },

    //---------------------------------------------------
    // setLayout
    //---------------------------------------------------

    setLayout: function (mainRegion) {
        mainRegion.show(this.frameLayout);
    },

    //--------------------------------------------------

    changeSublayout: function () {

        var subModule = app.submodules[app.context.get("module")];

        if (_.isObject(subModule) && _.isFunction(subModule.setLayout)) {
            subModule.setLayout();
            this.frameLayout.onModuleChange();
        }
    },

    //----------------------------------------------------
    // getRegions
    //----------------------------------------------------

    setRegion: function (regionName, view) {

        if (this.frameLayout[regionName + "Region"] && !_.isEmpty(view)) {
            this.frameLayout[regionName + "Region"].show(view);
        }
    }
});

module.exports = Frame;
