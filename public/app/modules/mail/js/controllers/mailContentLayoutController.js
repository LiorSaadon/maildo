define(function (require) {
    "use strict";

    var app = require("mbApp");
    var ContentLayout = require("mail-views/mailContentLayout");
    var MailTableView = require("mail-views/mailTableView");
    var PreviewView = require("mail-views/previewView");
    var ComposeView = require("mail-views/composeView/composeView");
    var EmptyMailView = require("mail-views/emptyMailView");

    var MailContentController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailContentController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = mail.dataController.getMailCollection();
                this._bindEvents();
            },

            //-----------------------------------------------------

            _bindEvents:function(){

                this.listenTo(mail.channel.vent, "discard:success", this.closeMailView);
                this.listenTo(mail.channel.vent, "mailTable:ItemClicked", this.showMail);
                this.listenTo(app.context, 'change:mail.action', this.closeMailView);
            },

            //----------------------------------------------------
            // newLayout
            //----------------------------------------------------

            newLayout: function () {

                this.contentLayout = new ContentLayout();
                this.listenTo(this.contentLayout, "render", this.onLayoutRender);

                return this.contentLayout;
            },

            //----------------------------------------------------

            onLayoutRender: function () {

                var action = app.context.get("mail.action");

                var emptyMailView = new EmptyMailView();
                this.contentLayout.previewRegion.add(emptyMailView);

                var tableView = new MailTableView({collection: this.mails});
                this.contentLayout.itemsRegion.show(tableView);
            },

            //----------------------------------------------------
            // showMail
            //----------------------------------------------------

            showMail: function (mailModel) {

                if(_.isObject(mailModel)){

                    mail.channel.vent.trigger("mail:select", {selectBy: "none"});
                    mail.channel.vent.trigger("mail:markAs", {label: 'read', items:[mailModel.id]});

                    this.mailView = !mailModel.get("groups.draft") ? new PreviewView({model: mailModel}) : new ComposeView({model: mailModel});
                    this.contentLayout.previewRegion.add(this.mailView);
                }
            },

            //----------------------------------------------------

            closeMailView: function(){

                if(this.contentLayout){
                    this.contentLayout.previewRegion.clean();
                }
            }
        });
    });
    return MailContentController;
});
