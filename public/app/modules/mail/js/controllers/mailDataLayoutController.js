define(function (require) {
    "use strict";

    var app = require("mbApp");
    var DataLayout = require("mail-views/dataLayout");
    var MailTableView = require("mail-views/mailTableView");
    var PreviewView = require("mail-views/previewView");
    var MailModel = require("mail-models/mailModel");
    var MessagesView = require("mail-views/messagesView");
    var EmptyMailView = require("mail-views/emptyMailView");


    var DataLayoutController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        DataLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = mail.dataController.getMailCollection();

                this.listenTo(mail.vent, "mail:preview", this.showMail);
                this.listenTo(this.mails, "change:selection", this.onSelectionChange, this);
            },

            //----------------------------------------------------
            // setLayout
            //----------------------------------------------------

            setLayout: function (region) {

                this.dataLayout = new DataLayout();
                this.listenTo(this.dataLayout, "render", this.onLayoutRender);
                region.show(this.dataLayout);
            },

            //----------------------------------------------------

            onLayoutRender: function () {

                var state = app.context.get("router.state");

                this.mails.fetchBy({
                    filters: {
                        page: state.params.page,
                        query: state.params.query || 'groups:' + state.action
                    },
                    success: _.bind(function () {
                        if (this.mails.size() > 0) {
                            this.showCollection(state.action);
                        } else {
                            this.showEmptyFolderMessage(state.action);
                        }
                    }, this)
                });
            },

            //----------------------------------------------------

            showCollection: function (action) {

                this.mails.clearSelected();

                var tableView = new MailTableView({collection: this.mails, action: action});
                this.dataLayout.itemsRegion.show(tableView);
            },

            //----------------------------------------------------

            showEmptyFolderMessage: function (action) {

                var messagesView = new MessagesView({msgType: "emptyFolder", action: action});
                this.dataLayout.messageBoard.show(messagesView);
            },

            //----------------------------------------------------
            // showMail
            //----------------------------------------------------

            showMail: function (id) {

                var mailModel = new MailModel({id: id});

                mail.vent.trigger("actions", {actionType: 'markAs', label: 'read'});
                mail.vent.trigger("actions", {actionType: "select", selectBy: "none"});

                mailModel.fetch({
                    success: _.bind(function () {
                        var previewView = new PreviewView({model: mailModel});
                        this.dataLayout.previewRegion.show(previewView);
                    }, this)
                });
            },

            //-----------------------------------------------------
            // onSelectionChange
            //-----------------------------------------------------

            onSelectionChange:function(){

                var emptyMailView = new EmptyMailView({selected:this.mails.getSelected().length});
                this.dataLayout.previewRegion.show(emptyMailView);
            }
        });
    });
    return DataLayoutController;
});
