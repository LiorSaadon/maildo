define(function (require) {
    "use strict";

    var LE = require("app");

    LE.module('LECampaigns', function (LECampaigns, LE, Backbone, Marionette, $, _) {
        EngagementWindowStudioController = Marionette.Controller.extend({

            initialize: function (options) {
                this.el = options.el;
                this.vent = options.vent;
                this.engagementWindowStudioModel = new EngagementWindowStudioModel();
                this.campaignId = options.campaignId;
                this.windowId = options.windowId;

                this.bindEvents();
            },

            //--------------------------------------------------------

            bindEvents: function () {

                this.listenTo(this.vent, "tab:changed", this.handleTabChange, this);
                this.listenTo(this.vent, "survey:deleteSingleSurvey", this.deleteSingleSurvey, this);
                this.listenTo(this.vent, "survey:getSingleSurvey", this.handleSurveySelected, this);
                this.listenTo(this.vent, "survey:createNewSurvey", this.handleCreateNewSurvey, this);
                this.listenTo(this.vent, "survey:collection:questionDelete", this.deleteQuestion, this);
                this.listenTo(this.vent, "survey:collection:questionDuplicate", this.addQuestion, this);
                this.listenTo(this.vent, "survey:collection:questionAdd", this.addQuestion, this);
                this.listenTo(this.vent, "survey:collection:questionReorder", this.reorderQuestion, this);
                this.listenTo(this.vent, "survey:collection:questionUpdate", this.updateQuestion, this);
                this.listenTo(this.vent, "survey:collection:questionDuplicateSpecial", this.duplicateSpecialQuestion, this);
            },

            //---------------------------------------------------------

            deleteQuestion: function(index) {
                this.currentSurvey.deleteQuestion(index);
            },

            //---------------------------------------------------------

            addQuestion: function(question) {
                this.currentSurvey.addQuestion(question);
            },

            //---------------------------------------------------------

            reorderQuestion: function(question,index1, index2) {
                this.updateQuestion(question, index1);
                this.currentSurvey.reorderQuestion(index1, index2);
            },

            //---------------------------------------------------------

            updateQuestion: function(question, index) {
                this.currentSurvey.updateQuestion(question, index);
            },

            //---------------------------------------------------------

            duplicateSpecialQuestion: function (options) {
                this.updateQuestion(options.org,options.orgIndex);
                this.currentSurvey.addQuestion(options.dup);
                this.vent.trigger("engagementWindow:duplicateSpecialDone", this);
            },

            //--------------------------------------------------------

            handleSurveySelected: function(id) {

                this.saveCurrentSurvey();
                this.changeSurvey(id);
            },

            //--------------------------------------------------------

            changeSurvey:function(id){
                data.getSurvey(id, function(model){
                    trigger("survey:change", model);  //==> layoutController...
                    LECampaigns.notifier.showSuccess(LE.translator.translate('LECampaigns.engagementWindow.messages.saveSingleSurvey.success'));
                });
            },

            //----------------------------------------------------------

            saveCurrentSurvey: function (currentSurvey, callback) {

                var that = this;

                if ((currentSurvey.hasChanged() || currentSurvey.isNew() ) && !currentSurvey.templateSurvey) {

                    this.setSurveyTypeStatus(survey);

                    currentSurvey.save(null, {
                        success: function(model, resp, options) {
                            if(model.isValid()){
                                this.vent.trigger("survey:saved",model);  //windowAction
                            }
                        },
                        error: function(model, resp, options) {
                            that.vent.trigger("engagementWindow:responseSaveEngagementWindow", {isValid: false});
                        }
                    });
                }
            }
        });
    });
    return EngagementWindowStudioController;

});


