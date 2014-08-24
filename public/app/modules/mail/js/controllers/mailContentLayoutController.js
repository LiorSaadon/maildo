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

            _bindEvents: function () {

                this.listenTo(this.mails, "fetch:success", this.closeMailView);
                this.listenTo(mail.channel.vent, "mailTable:ItemClicked", this.showMailView);
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
            // mailView
            //----------------------------------------------------

            showMailView: function (mailModel) {

                if (_.isObject(mailModel)) {

                    this.viewModel = mailModel;

                    mail.channel.vent.trigger("mail:select", {selectBy: "none"});
                    mail.channel.vent.trigger("mail:markAs", {label: 'read', items: [mailModel.id]});

                    var mailView = !mailModel.get("groups.draft") ? new PreviewView({model: mailModel}) : new ComposeView({model: mailModel});
                    this.contentLayout.previewRegion.add(mailView);
                }
            },

            //----------------------------------------------------

            closeMailView:function(){

                if (_.isObject(this.viewModel)) {
                    var _viewModel = this.mails.get(this.viewModel.id);

                    if(_.isEmpty(_viewModel) && this.contentLayout && this.contentLayout.previewRegion){
                        this.contentLayout.previewRegion.clean();
                    }
                }
            }
        });
    });
    return MailContentController;
});
