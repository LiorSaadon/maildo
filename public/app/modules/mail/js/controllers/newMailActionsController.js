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
                    this.saveToDraft();
                }
            },

            //----------------------------------------------------
            // composeModel
            //----------------------------------------------------

            composeModel: function () {

                this.mailModel = new MailModel();
                return this.mailModel;
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
                    case "saveToDraft":
                        this.saveToDraft();
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
                            delete that.mailModel;
                            mail.router.previous();
                        }
                    });
                }
            },

            //-------------------------------------------

            discard:function(){

                delete this.mailModel;
                mail.router.previous();
            },

            //-------------------------------------------

            saveToDraft: function () {

                var that = this;

                if (_.isObject(this.mailModel)) {

                    if(this.mailModel.get('to') !== '' || this.mailModel.get('bcc') !== '' || this.mailModel.get('cc') !== ''){

                        this.mailModel.addLabel("draft");
                        this.mailModel.set("in","draft");

                        this.mailModel.save(null, {
                            silent: true,
                            success: function(){
                                delete that.mailModel;
                            }
                        });
                    }
                }
            }
        });
    });
    return NewMailActionsController;
});

