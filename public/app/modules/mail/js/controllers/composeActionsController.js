define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");

    var ComposeActionsController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ComposeActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.listenTo(mail.vent, 'mail:send', this.send, this);
                this.listenTo(mail.vent, 'mail:save', this.save, this);
                this.listenTo(mail.vent, 'mail:discard', this.discard, this);
            },

            //-------------------------------------------

            send: function(mailModel) {

                if(_.isObject(mailModel)){

                    mailModel.save(null,{

                        invalid: function (model, error) {
                            alert(error);
                        },
                        success: function () {
                            mail.router.previous();
                        }
                    });
                }
            },

            //-------------------------------------------

            discard:function(mailModel){

                if(mailModel.get("groups.draft")){

                    mailModel.destroy({

                        success: function(){
                            mail.layoutController.showData();
                        }
                    });
                }
            },

            //-------------------------------------------

            save: function (mailModel) {

                if(mailModel.isNew() || mailModel.get("groups.draft")){

                    mailModel.saveAsDraft({

                    });
                }
            }
        });
    });
    return ComposeActionsController;
});

