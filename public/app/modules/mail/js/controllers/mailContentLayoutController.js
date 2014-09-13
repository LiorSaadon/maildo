define(function (require) {
    "use strict";

    var app = require("mbApp");
    var ContentLayout = require("mail-views/mailContentLayout");
    var MailsView = require("mail-views/mailsView");
    var PreviewView = require("mail-views/previewView");
    var ComposeView = require("mail-views/composeView/composeView");
    var EmptyMailView = require("mail-views/emptyMailView");

    var MailContentController = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailContentController = Marionette.Controller.extend({

            initialize: function () {

                this.mails = mail.channel.reqres.request("mail:collection");
                this._bindEvents();
            },

            //-----------------------------------------------------

            _bindEvents: function () {

                this.listenTo(this.mails, "change:items", this.closePreview);
                this.listenTo(this.mails, "change:selection", this.togglePreview);
                this.listenTo(mail.channel.vent, "mailTable:ItemClicked", this.showPreview);
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

                var tableView = new MailsView({collection: this.mails});
                this.contentLayout.itemsRegion.add(tableView);
            },

            //----------------------------------------------------
            // showPreview
            //----------------------------------------------------

            showPreview: function (mailModel) {

                if (_.isObject(mailModel)) {

                    mail.channel.vent.trigger("mail:select", {selectBy: "none"});
                    mail.channel.vent.trigger("mail:markAs", {label: 'read', items: [mailModel.id]});

                    this.preview = !mailModel.get("groups.draft") ? new PreviewView({model: mailModel}) : new ComposeView({model: mailModel});
                    this.contentLayout.previewRegion.add(this.preview);
                }
            },

            //----------------------------------------------------

            togglePreview:function(){

                if (_.isObject(this.preview)){

                    var selected = this.mails.getSelected().length;
                    this.preview.$el.toggle(selected === 0);
                }
            },

            //----------------------------------------------------

            closePreview:function(){

                if (this.preview && this.preview.model) {

                    var isModelExist = _.isObject(this.mails.get(this.preview.model.id));

                    if(!isModelExist){
                        this.contentLayout.previewRegion.clean();
                    }
                }
            }
        });
    });
    return MailContentController;
});
