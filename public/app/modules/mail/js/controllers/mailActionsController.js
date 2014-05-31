define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = mail.dataController.mails;
                this.listenTo(mail.vent, 'actions', this.actions, this);
            },

            //-------------------------------------------------------------------

            actions: function (options) {

                options = options || {};

                switch (options.actionType) {

                    case 'select':
                        this.select(options);
                        break;
                    case "moveTo":
                        this.moveTo(options);
                        break;
                    case "delete":
                        this.deleteItems(options);
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

            deleteItems: function (options) {

                this.collection.destroy({

                    selectedItems: this.collection.getSelected(),

                    success: _.bind(function () {
                        this.collection.refresh();
                    }, this)
                });
            }
        });
    });
    return ActionsController;
});
