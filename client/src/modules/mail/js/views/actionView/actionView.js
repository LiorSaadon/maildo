"use strict";

var app = require("app");
var PagerView = require("./_pagerView");
var MoveToView = require("./_moveToView");
var MoreActionsView = require("./_moreActionsView");
var template = require("mail-templates/actionView.hbs");

var ActionView = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {
    ActionView = Marionette.ItemView.extend({
        template: template,
        className: 'actionView',

        ui: {
            btnSelect: ".btnSelect",
            btnMoveTo: ".btnMoveTo",
            btnDelete: ".btnDelete",
            btnMore: ".btnMore",
            pagerRegion: ".pager",
            serverActionsRegion: ".serverActions",
            lblCompose:".lblCompose",
            btnDiscardDrafts: ".btnDiscardDrafts",
            btnDeleteForever: ".btnDeleteForever",
            btnNotSpam: ".btnNotSpam"
        },

        events: {
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
            "click @ui.btnDelete": function () {
                mail.channel.vent.trigger("mail:moveTo", {target: 'trash'});
            },
            "click @ui.btnNotSpam": function () {
                mail.channel.vent.trigger("mail:moveTo", {target: 'inbox'});
            },
            "click @ui.btnDiscardDrafts": function () {
                mail.channel.vent.trigger("mail:delete");
            },
            "click @ui.btnDeleteForever": function () {
                mail.channel.vent.trigger("mail:delete");
            }
        },

        //-----------------------------------------------------------

        initialize: function (options) {

            this.mails = mail.channel.reqres.request("mail:collection");
            this._bindEvents();
        },

        //-----------------------------------------------------

        _bindEvents: function () {

            this.listenTo(mail.channel.vent, "mail:change", this.onMailChange, this);
            this.listenTo(this.mails, "change:selection", this.showRelevantItems, this);
            this.listenTo(app.context, 'change:mail.action', this.showRelevantItems, this);
        },

        //------------------------------------------------------

        templateHelpers: function () {

            return{
                action: _s.capitalize(app.context.get("mail.action.type"))
            };
        },

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
                default:
                    this.showListOptions(action);
                    break;
            }
        },

        //-------------------------------------------------------

        resetUI:function(){

            this.showItems(_.keys(this.ui), false);
            this.ui.lblCompose.text(app.translator.translate("mail:newMessage"));
        },

        //---------------------------------------------------------

        showListOptions: function (action) {

            this.showItems(["btnSelect", "pagerRegion"]);

            if (!_.isEmpty(this.mails.getSelected())) {

                switch (action) {
                    case "draft":
                        this.showItems(["btnSelect", "btnDiscardDrafts", "btnMore"]);
                        break;
                    case "spam":
                        this.showItems(["btnSelect", "btnNotSpam", "btnDeleteForever", "btnMore"]);
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
                subject = app.translator.translate("mail:newMessage");
            }
            this.ui.lblCompose.text(subject);
        }
    });
});

module.exports = ActionView;
