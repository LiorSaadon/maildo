define(function (require) {
    "use strict";

    var app = require('mbApp');
    var _ = require('underscore');
    var Marionette = require('marionette');
    var FrameLayout = require('frame-views/frameLayout');
    var LayoutHelpers = require("assets-resolvers/ui/dropdownDisplayer");
    var eModules = require('json!assets-enums/eModules.json');

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

        changeSublayout:function(){

            var subModule = app.submodules[app.context.get("module")];

            if(_.isObject(subModule) && _.isFunction(subModule.setLayout)){
                subModule.setLayout();
                this.frameLayout.onModuleChange();
            }
        },

        //----------------------------------------------------
        // getRegions
        //----------------------------------------------------

        setRegion:function(regionName, view){

            if(this.frameLayout[regionName+"Region"] && !_.isEmpty(view)){
                this.frameLayout[regionName+"Region"].show(view);
            }
        }
    });

    return Frame;
});