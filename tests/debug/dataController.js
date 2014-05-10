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

                getModelByType: function (options, callback) {

                }

                //--------------------------------------------------------

                getSurvey:function(id){




                    options = options || {};

                    this.saveSurvey();

                    if(options.type === "WINDOW"){
                      callback(this.windowModel);
                      return;
                    }else{

                        getSurvey(options.type);

                    }





                        var id = this.getIdByType(options.type);

                        this.serveyModel = this.getSurveyModel(id);

                        if(_.isEmpty(this.surveyModel)){
                            this.createNewSurvey(options, callback);
                        }else{
                           callback(this.surveyModel);
                        }
                   }
                },

                //---------------------------------------------------------------



            if(_.isFinite(id)){

        }

        this.serveyModel = this.getSurveyModel(id);

        if(_.isEmpty(this.surveyModel)){
            this.createNewSurvey();
        }

        return this.surveyModel;



                 getSurveyModel: function(id){

                    this.

                 }





                saveCurrentSurvey:function(){
                   // this.surveyActionController.save(this.surveyModel);
                }

        });
    });
    return ChatWindowDataController;
});



