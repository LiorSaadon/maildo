define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
    var template = require("tpl!mail-templates/actionView.tmpl");
    var PagerView = require("mail-views/actionView/_pagerView");
    var MoveToView = require("mail-views/actionView/_moveToView");
    var MoreActionsView = require("mail-views/actionView/_moreActionsView");

    var ActionView = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {
        ActionView = Marionette.ItemView.extend({
            template: template,
            className: 'actionView',

            initialize: function (options) {

                this.listenTo(mail.channel.vent, "mail:change", this.onMailChange, this);
                this.listenTo(app.context, 'change:mail.action', this.showRelevantItems, this);
                this.listenTo(mail.dataController.getMailCollection(), "change:selection", this.showRelevantItems, this);
            },

            ui: {
                btnSelect: ".btnSelect",
                btnMoveTo: ".btnMoveTo",
                btnRefresh: ".btnRefresh",
                btnDelete: ".btnDelete",
                btnMore: ".btnMore",
                pagerRegion: ".pager",
                lblSettings: ".lblSettings",
                lblCompose:".lblCompose",
                btnSettings: ".btnSettings",
                btnDiscardDrafts: ".btnDiscardDrafts",
                btnDeleteForever: ".btnDeleteForever",
                btnNotSpam: ".btnNotSpam"
            },

            events: {
                "click .btnSettings": function () {
                    mail.router.navigate("settings", {trigger: true});
                },
                "click .selectAll": function () {
                    mail.channel.vent.trigger("mail:select", {selectBy: "all"});
                },
                "click .selectNone": function () {
                    mail.channel.vent.trigger("mail:select", {selectBy: "none"});
                },
                "click .selectRead": function () {
                    mail.channel.vent.trigger("mail:select", {selectBy: "read"});
                },
                "click .selectUnread": function () {
                    mail.channel.vent.trigger("mail:select", {selectBy: "unread"});
                },
                "click .btnDelete": function () {
                    mail.channel.vent.trigger("mail:moveTo", {target: 'trash'});
                },
                "click .btnNotSpam": function () {
                    mail.channel.vent.trigger("mail:moveTo", {target: 'inbox'});
                },
                "click .btnDiscardDrafts": function () {
                    mail.channel.vent.trigger("mail:delete");
                },
                "click .btnDeleteForever": function () {
                    mail.channel.vent.trigger("mail:delete");
                }
            },

            //------------------------------------------------------

            customTemplateHelpers: function () {

                return{
                    action: _s.capitalize(app.context.get("mail.action.type"))
                };
            },

            //------------------------------------------------------
            // onRender
            //------------------------------------------------------

            onRender: function () {

                this.pagerView = new PagerView({
                    el: this.ui.pagerRegion
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

                var action = app.context.get("mail.action.type");

                this.resetUI();

                switch (action) {
                    case "compose":
                        this.showItems(["lblCompose"]);
                        break;
                    case "settings":
                        this.showItems(["lblSettings"]);
                        break;
                    default:
                        this.showListOptions(action);
                        break;
                }
            },

            //-------------------------------------------------------

            resetUI:function(){

                this.showItems(_.keys(this.ui), false);
                this.ui.lblCompose.text(app.translator.translate("mail.newMessage"));
            },

            //---------------------------------------------------------

            showListOptions: function (action) {

                this.showItems(["btnSelect", "pagerRegion"]);

                if (!_.isEmpty(mail.dataController.getMailCollection().getSelected())) {

                    switch (action) {
                        case "draft":
                            this.showItems(["btnSelect", "btnDiscardDrafts", "btnMore"]);
                            break;
                        case "spam":
                            this.showItems(["btnSelect", , "btnNotSpam", "btnDeleteForever", "btnMore"]);
                            break;
                        case "trash":
                            this.showItems(["btnSelect", "btnDeleteForever", "btnMoveTo", "btnMore"]);
                            break;
                        default:
                            this.showItems(["btnSelect", "btnDelete", "btnMoveTo", "btnMore"]);
                            break;
                    }
                }
            },

            //------------------------------------------------------

            showItems: function (items, show) {

                show = _.isBoolean(show) ? show : true;

                _.each(items, _.bind(function (item) {
                    this.ui[item].toggle(show);
                }, this));
            },

            //---------------------------------------------------------
            // onMailChange
            //---------------------------------------------------------

            onMailChange:function(mailModel){

                var subject = mailModel.get('subject');

                if(_.isEmpty(subject)){
                    subject = app.translator.translate("mail.newMessage");
                }
                this.ui.lblCompose.text(subject);
            }
        });
    });

    return ActionView;
});