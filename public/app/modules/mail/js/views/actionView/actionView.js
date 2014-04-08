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
                composeArea: ".compose-section",
                actionListArea: ".action-list-section",
                btnSelect: ".btnSelect",
                btnMoveTo: ".btnMoveTo",
                btnSend: ".btnSend",
                btnRefresh: ".btnRefresh",
                btnSaveNow: ".btnSaveNow",
                btnDiscard: ".btnDiscard",
                btnBackToInbox: ".btnBackToInbox",
                btnDiscardDrafts: ".btnDiscardDrafts",
                btnDelete: ".btnDelete",
                btnMore: ".btnMore",
                pagerContainer: ".pager",
                lblSettings:".lblSettings",
                btnSettings: ".btnSettings"
            },

            events: {
                "click .btnDelete": function () {
                    mail.vent.trigger("actions", {actionType: 'delete'});
                },
                "click .selectAll": function () {
                    mail.vent.trigger("actions", {actionType: 'select', selectBy:"all"});
                },
                "click .selectNone": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy:"none"});
                },
                "click .selectRead": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy:"read"});
                },
                "click .selectUnread": function () {
                    mail.vent.trigger("actions", {actionType: "select", selectBy:"unread"});
                },
                "click .btnSend": function () {
                    mail.vent.trigger("newMail", {actionType: 'send'});
                },
                "click .btnDiscard": function () {
                    mail.vent.trigger("newMail", {actionType: 'discard'});
                },
                "click .btnSettings": function () {
                    mail.router.navigate("settings",{ trigger: true });
                },
                "click .btnBackToInbox": function () {
                    mail.router.previous({ trigger: true });
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

            showRelevantItems: function(){

                this.currentContext = app.context.get("router.state.action");

                switch (this.currentContext) {
                    case "compose":
                        this.showComposeButtons(true);
                        this.showActionButtons(false);
                        this.showPager(false);
                        this.showSettingsLabel(false);
                        break;
                    case "settings":
                        this.showComposeButtons(false);
                        this.showActionButtons(false);
                        this.showPager(false);
                        this.showSettingsLabel(true);
                        break;
                    default:
                        this.showComposeButtons(false);
                        this.showActionButtons(true);
                        this.showPager(true);
                        this.showSettingsLabel(false);
                }
            },

            //--------------------------------------------------

            showComposeButtons: function(show){

                this.ui.composeArea.toggleClass("hide", !show);
//                if(show){
//                    this.ui.composeArea.show();
//                }else{
//                    this.ui.composeArea.hide();
//                }
            },

            //--------------------------------------------------

            showPager: function(show){

                this.ui.pagerContainer.toggleClass("hide", !show);
//                if(show){
//                    this.ui.pagerContainer.show();
//                }else{
//                    this.ui.pagerContainer.hide();
//                }
            },

            //--------------------------------------------------

            showSettingsLabel: function(show){

                this.ui.lblSettings.toggleClass("hide", !show);
//                if(show){
//                    this.ui.lblSettings.show();
//                }else{
//                    this.ui.lblSettings.hide();
//                }
            },

            //--------------------------------------------------

            showActionButtons: function(show){

                if(show){
                    this.ui.actionListArea.find("div[class^='btn']").hide();

                    switch(this.actionContext()){
                        case "view":
                            this.ui.btnBackToInbox.show();
                            this.ui.btnRefresh.show();
                            break;
                        case "empty-list":
                            this.ui.btnSelect.show();
                            this.ui.btnRefresh.show();
                            break;
                        case "list":
                            this.ui.btnMore.show();
                            this.ui.btnSelect.show();
                            this.ui.btnDelete.show();
                            this.ui.btnMoveTo.show();
                    }
                    this.ui.actionListArea.show();
                }else{
                    this.ui.actionListArea.hide();
                }
            },

            //-----------------------------------------------------

            actionContext:function(){

                var param = app.context.get("router.state.params");

                if(!_.isEmpty(param.id)){
                    return "view";
                }
                if(!_.isEmpty(mail.dataController.getMailCollection().getSelected())){
                    return "list";
                }
                return "empty-list";
            }
        });
    });

    return ActionView;
});