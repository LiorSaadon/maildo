define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");

    var NewMailActionsController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        NewMailActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.listenTo(mail.vent, 'newMail', this.actions, this);
                this.listenTo(app.context, 'change:router.state', this.onStateChange, this);
            },

            //----------------------------------------------------
            // onStateChange
            //----------------------------------------------------

            onStateChange: function () {

                var action = app.context.get("router.state.action");

                if(action !== "compose"){
                    this.saveAsDraft();
                }
            },

            //----------------------------------------------------
            // composeModel
            //----------------------------------------------------

            composeModel: function () {

                this.deleteModel();

                this.mailModel = new MailModel();
                return this.mailModel;
            },

            //----------------------------------------------------

            deleteModel: function(){
                if(_.isObject(this.mailModel)){
                    delete this.mailModel;
                }
            },

            //----------------------------------------------------
            // actions
            //----------------------------------------------------

            actions:function(options){

                switch(options.actionType){

                    case "send":
                        this.send();
                        break;
                    case "discard":
                        this.discard();
                        break;
                    case "saveAsDraft":
                        this.saveAsDraft();
                        break;
                }
            },

            //-------------------------------------------

            send: function() {

                var that = this;

                if(typeof this.mailModel == 'object'){

                    this.mailModel.save(null,{

                        invalid: function (model, error) {
                            alert(error);
                        },
                        success: function () {
                            that.deleteModel();
                            mail.router.previous();
                        }
                    });
                }
            },

            //-------------------------------------------

            discard:function(){

                this.deleteModel();
                mail.router.previous();
            },

            //-------------------------------------------

            saveAsDraft: function () {

                var that = this;

                if (_.isObject(this.mailModel)) {

                    this.mailModel.saveAsDraft({
                        success: function(){
                            that.deleteModel();
                        }
                    });
                }
            }
        });
    });
    return NewMailActionsController;
});

