define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/actionView.tmpl");
    var PagerView = require("mail-views/actionView/_pagerView");
    var MoveToView = require("mail-views/actionView/_moveToView");
    var MoreActionsView = require("mail-views/actionView/_moreActionsView");

    var ActionView = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {
        ActionView = Marionette.ItemView.extend({
            template: template,
            className: 'actionView',

            initialize: function (options) {

                this.listenTo(app.context, 'change:router.state', this.showRelevantItems, this);
                this.listenTo(mail.dataController.getMailCollection(), "change:selection", this.showRelevantItems, this);
            },

            ui: {
                composeRegion: ".compose-section",
                actionListRegion: ".action-list-section",
                btnSelect: ".btnSelect",
                btnMoveTo: ".btnMoveTo",
                btnSend: ".btnSend",
                btnRefresh: ".btnRefresh",
                btnSaveNow: ".btnSaveNow",
                btnDiscard: ".btnDiscard",
                btnBackToInbox: ".btnBackToInbox",
                btnDelete: ".btnDelete",
                btnMore: ".btnMore",
                pagerRegion: ".pager",
                lblSettings: ".lblSettings",
                btnSettings: ".btnSettings"
            },

            events: {
                "click .btnSettings": function () {
                    mail.router.navigate("settings");
                },
                "click .btnBackToInbox": function () {
                    mail.router.previous();
                },
                "click .selectAll": function () {
                    mail.vent.trigger("actions", {actionType: 'select', selectBy: "all"});
                },
                "click .selectNone": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy: "none"});
                },
                "click .selectRead": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy: "read"});
                },
                "click .selectUnread": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy: "unread"});
                },
                "click .btnDelete": function () {
                    mail.vent.trigger("actions", {actionType: 'delete'});
                },
                "click .btnSend": function () {
                    mail.vent.trigger("newMail", {actionType: 'send'});
                },
                "click .btnDiscard": function () {
                    mail.vent.trigger("newMail", {actionType: 'discard'});
                }
            },

            //------------------------------------------------------
            // onRender
            //------------------------------------------------------

            onRender: function () {

                this.pagerView = new PagerView({
                    el: this.ui.pagerContainer
                });
                this.pagerView.render();

                this.moreActionsView = new MoreActionsView({
                    el: this.ui.btnMore
                });
                this.moreActionsView.render();

                this.moveToView = new MoveToView({
                    el: this.ui.btnMoveTo
                });
                this.moveToView.render();
            },

            //------------------------------------------------------
            // showRelevantItems
            //------------------------------------------------------

            showRelevantItems: function () {

                this.showItems(["composeRegion", "lblSettings", "pagerRegion", "btnBackToInbox","btnRefresh", "btnSelect","btnMore", "btnSelect", "btnDelete", "btnMoveTo"], false);

                switch (app.context.get("router.state.action")) {
                    case "compose":
                        this.showItems(["composeRegion"]);
                        break;
                    case "settings":
                        this.showItems(["lblSettings"]);
                        break;
                    default:
                        this.showActionButtons();
                        break;
                }
            },

            //--------------------------------------------------

            showActionButtons: function () {

                switch (this.actionContext()) {
                    case "view":
                        this.showItems(["btnBackToInbox","btnRefresh"]);
                        break;
                    case "empty-list":
                        this.showItems(["btnSelect", "btnRefresh"]);
                        break;
                    case "list":
                        this.showItems(["btnMore", "btnSelect", "btnDelete", "btnMoveTo"]);
                        break;
                }
            },

            //-----------------------------------------------------

            actionContext: function () {

                var param = app.context.get("router.state.params");

                if (!_.isEmpty(param.id)) {
                    return "view";
                }
                if (!_.isEmpty(mail.dataController.getMailCollection().getSelected())) {
                    return "list";
                }
                return "empty-list";
            },

            //------------------------------------------------------

            showItems: function (items, show) {

                show = _.isBoolean(show) ? show : true;

                _.each(items, _.bind(function(item){
                    if(show){
                        this.ui[item].show();
                    }else{
                        this.ui[item].hide();
                    }
                },this));
            }
        });
    });

    return ActionView;
});