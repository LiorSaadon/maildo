define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = mail.dataController.mails;
                this.listenTo(mail.vent, 'actions', this.actions, this);
            },

            //-------------------------------------------------------------------

            actions: function (options) {

                switch (options.actionType) {

                    case 'select':
                        this.select(options);
                        break;
                    case "moveTo":
                        this.moveTo(options);
                        break;
                    case "markAs":
                        this.markAs(options);
                        break;
                }
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

                var that = this, items = this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get(item);
                    if (model) {
                        model.markAs(options.label);
                    }
                });
                this.updateCollection(items, true);
            },

            //----------------------------------------------------

            moveTo: function (options) {

                var that = this, items = this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get(item);
                    if (model) {
                        model.moveTo(options.target);
                    }
                });

                this.updateCollection(items);
            },

            //----------------------------------------------------

            updateCollection: function (items, silent) {

                var that = this;

                this.collection.update({

                    selectedItems: items,
                    fields: ['id', 'labels', 'groups'],

                    success: function () {
                        if (!silent) {
                            that.collection.refresh();
                        }
                    }
                });
            }
        });
    });
    return ActionsController;
});
