define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ComposeActionsController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ComposeActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.listenTo(mail.vent, 'mail:send', this.send, this);
                this.listenTo(mail.vent, 'mail:discard', this.discard, this);
                this.listenTo(mail.vent, 'composeView:close', this.saveAsDraft, this);
            },

            //-------------------------------------------

            send: function (mailModel) {

                if (_.isObject(mailModel)) {

                    mailModel.save(null, {

                        invalid: function (model, error) {},

                        success: function () {
                            mail.router.previous();
                        }
                    });
                }
            },

            //-------------------------------------------

            discard: function (mailModel) {

                if(mailModel.isNew()){
                    mail.router.previous();
                }else{
                    if (mailModel.get("groups.draft")) {
                        mailModel.destroy({
                            success: function () {
                                mail.layoutController.showData();
                            }
                        });
                    }
                }
            },

            //-------------------------------------------

            saveAsDraft: function (mailModel) {

                if (mailModel.isNew() || mailModel.get("groups.draft")) {

                    var newModel = $.extend(true, {}, mailModel);

                    newModel.moveTo("draft");

                    newModel.save(null, {
                        validateType: "draft"
                    });
                }
            }
        });
    });
    return ComposeActionsController;
});

