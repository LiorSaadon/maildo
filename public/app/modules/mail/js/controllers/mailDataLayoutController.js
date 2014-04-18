define(function (require) {
    "use strict";

    var app = require("mbApp");
    var DataLayout = require("mail-views/dataLayout");
    var MailTableView = require("mail-views/mailTableView");
    var PreviewView = require("mail-views/previewView");
    var MailModel = require("mail-models/mailModel");
    var MessagesView = require("mail-views/messagesView");


    var DataLayoutController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        DataLayoutController = Marionette.Controller.extend({

            setLayout: function (region) {

                this.dataLayout = new DataLayout();

                this.listenTo(this.dataLayout, "render", this.onLayoutRender, this);
                region.show(this.dataLayout);
            },

            //----------------------------------------------------
            // onLayoutRender
            //----------------------------------------------------

            onLayoutRender: function () {

                var state = app.context.get("router.state");

                if (state.params.id) {
                    this.showItem(state.params.id);
                } else {
                    this.showCollection(state.action, state.params);
                }
            },

            //----------------------------------------------------

            showCollection: function (action, params) {

                this.mails = mail.dataController.getMailCollection();

                this.mails.fetchBy({
                    filters: {
                        page: params.page,
                        query: params.query || 'groups:' + action
                    },
                    success: _.bind(function () {
                        if (this.mails.size === 0) {
                            this.showMessage(action);
                        } else {
                            this.showCollectionItems(action);
                        }
                    }, this)
                });
            },

            //----------------------------------------------------

            showMessage: function (action) {

                var messagesView = new MessagesView({msgType:"emptyData", action: action});
                this.dataLayout.messageBoard.show(messagesView);
            },

            //----------------------------------------------------

            showCollectionItems: function (action) {

                this.mails.clearSelected();

                var tableView = new MailTableView({collection: this.mails, action: action});
                this.dataLayout.itemsRegion.show(tableView);
            },

            //----------------------------------------------------

            showItem: function (id) {

                var that = this;

                var mailModel = new MailModel({id: id});

                mailModel.fetch({
                    success: function () {
                        mail.vent.trigger("actions", {action: 'markAs', label: 'read', target: id});
                        var previewView = new PreviewView({model: mailModel});
                        that.dataLayout.previewRegion.show(previewView);
                    },
                    error: function () {
                        mail.router.previous();
                    }
                });
            }

        });
    });
    return DataLayoutController;
});
