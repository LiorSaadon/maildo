define(function (require) {
    "use strict";

    var LE = require("app");

    var ChatWindowDataController= {};

    LE.module('LECampaigns', function (LECampaigns, LE, Backbone, Marionette, $, _) {
        ChatWindowDataController = Marionette.Controller.extend({

            initialize: function (options) {

                this.surveyModel = null;
                this.windowModel = nulll
            },

            //--------------------------------------------------------

            onStateChange: function(options) {

                if(prevState !== options.state){

                    this.closeCurrentWindow(function(){
                        this.openNewWindow(options, function(){
                            this.state = options.state;
                        });
                    })
                }
            },
            //--------------------------------------------------------

            closeCurrent: function(callback){

               if(prevState === "WIN"){
                   chatActionsController.closePrevious(callback);
               }else{
                   surveyActionsController.closePrevious(callback);
               }
            },

            //--------------------------------------------------------

            openNew: function(options){

                if(options.state === "WIN"){
                    chatActionsController.display();
                }else{
                    surveyC.changeSurvey(options);
                }
            }
        });
    });
    return ChatWindowDataController;
});



