define(function (require) {
    "use strict";

    var app = require("mbApp");
    var DataLayout = require("mail-views/dataLayout");
    var MailTableView = require("mail-views/mailTableView");
    var PreviewView = require("mail-views/previewView");
    var ComposeView = require("mail-views/composeView/composeView");
    var MessagesView = require("mail-views/messagesView");
    var EmptyMailView = require("mail-views/emptyMailView");

    var DataLayoutController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        DataLayoutController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = mail.dataController.getMailCollection();

                this.listenTo(mail.vent,  "mailTable:ItemClicked", this.showMail);
                this.listenTo(this.mails, "update:success", this.onCollectionUpdate, this);
                this.listenTo(this.mails, "delete:success", this.onCollectionDelete, this);
                this.listenTo(this.mails, "change:selection", this.onSelectionChange, this);
            },

            //----------------------------------------------------
            // newLayout
            //----------------------------------------------------

            newLayout: function () {

                this.dataLayout = new DataLayout();
                this.listenTo(this.dataLayout, "render", this.onLayoutRender);

                return this.dataLayout;
            },

            //----------------------------------------------------

            onLayoutRender: function () {

                var action = app.context.get("mail.action");

                this.mails.clearSelected();

                this.mails.fetchBy({
                    filters: {
                        page: action.params.page,
                        query: action.params.query || 'groups:' + action.type
                    },
                    success: _.bind(function () {
                        if (this.mails.size() > 0) {
                            this.showCollection(action.type);
                        } else {
                            this.showEmptyFolderMessage(action.type);
                        }
                    }, this)
                });
            },

            //----------------------------------------------------

            showCollection: function (actionType) {

                var tableView = new MailTableView({collection: this.mails, action: actionType});
                this.dataLayout.itemsRegion.show(tableView);
            },

            //----------------------------------------------------

            showEmptyFolderMessage: function (actionType) {

                var messagesView = new MessagesView({msg:app.translator.translate("mail.emptyFolder."+actionType)});
                this.dataLayout.messageBoard.show(messagesView);
            },


            //----------------------------------------------------
            // showMail
            //----------------------------------------------------

            showMail: function (mailview) {

                if(_.isObject(mailview)){

                    var mailModel = mailview.model;

                    mail.vent.trigger("actions", {actionType: "select", selectBy: "none"});
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'read', items:[mailModel.id]});

                    var _view = !mailModel.get("groups.draft") ? new PreviewView({model: mailModel}) : new ComposeView({model: mailModel});
                    this.dataLayout.previewRegion.show(_view);
                }
            },

            //-----------------------------------------------------
            // onSelectionChange
            //-----------------------------------------------------

            onSelectionChange:function(){

                var emptyMailView = new EmptyMailView({selected:this.mails.getSelected().length});
                this.dataLayout.previewRegion.show(emptyMailView);
            },

            //-----------------------------------------------------

            onCollectionUpdate:function(){

                if(this.mails.size() === 0){
                    this.showEmptyFolderMessage();
                }
            },

            //-----------------------------------------------------

            onCollectionDelete:function(){

                if(this.mails.size() === 0){
                    this.showEmptyFolderMessage();
                }
            }
        });
    });
    return DataLayoutController;
});
