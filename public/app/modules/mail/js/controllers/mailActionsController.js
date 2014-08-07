define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = mail.dataController.mails;

                this.listenTo(mail.vent, 'mail:select', this.select, this);
                this.listenTo(mail.vent, 'mail:moveTo', this.moveTo, this);
                this.listenTo(mail.vent, 'mail:delete', this.deleteItems, this);
                this.listenTo(mail.vent, 'mail:markAs', this.markAs, this);
                this.listenTo(mail.vent, 'mail:send', this.send, this);
                this.listenTo(mail.vent, 'mail:delete', this.deleteItems, this);
                this.listenTo(mail.vent, 'mail:discard', this.discard, this);
                this.listenTo(mail.vent, 'composeView:close', this.saveAsDraft, this);
            },

            //----------------------------------------------------

            select: function (options) {

                switch (options.selectBy) {

                    case 'all':
                        this.collection.selectAllModels();
                        break;
                    case 'none':
                        this.collection.clearSelected();
                        break;
                    case 'read':
                        this.collection.selectModels(this.collection.filter("labels.read"), {exclusively: true});
                        break;
                    case 'unread':
                        this.collection.selectModels(this.collection.filter("labels.unread"), {exclusively: true});
                        break;
                }
            },

            //----------------------------------------------------

            markAs: function (options) {

                var that = this, items = options.items || this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get(item);
                    if (model) {
                        model.markAs(options.label);
                    }
                });
                this.updateItems(items, options);
            },

            //----------------------------------------------------

            moveTo: function (options) {

                var that = this, items = options.items || this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get(item);
                    if (model) {
                        model.moveTo(options.target, options);
                    }
                });
                this.updateItems(items, _.extend({}, options, {"refresh": true, "clearSelected": true}));
            },

            //----------------------------------------------------

            updateItems: function (items, options) {

                this.collection.update({

                    selectedItems: items,
                    fields: ['id', 'labels', 'groups'],

                    success: _.bind(function () {
                        if (options.clearSelected) {
                            this.collection.clearSelected();
                        }
                        if (options.refresh) {
                            this.collection.refresh();
                        }
                    }, this)
                });
            },

            //----------------------------------------------------

            deleteItems: function () {

                this.collection.destroy({

                    selectedItems: this.collection.getSelected(),

                    success: _.bind(function () {
                        this.collection.refresh();
                    }, this)
                });
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
    return ActionsController;
});
