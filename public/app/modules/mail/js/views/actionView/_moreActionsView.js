define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/moreActionsView.tmpl");

    require("assets-plugins/toggle.block");

    var MoreActionsView = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {
        MoreActionsView = Marionette.ItemView.extend({

            template: template,
            className: 'actionOptionsView',

            ui: {
                ddiStarred:".addStar",
                ddiNotStarred:".removeStar",
                ddiImp:".markImp",
                ddiNotImp:".markNotImp",
                ddiRead:".markRead",
                ddiUnread:".markUnread"
            },

            events: {
                "click @ui.ddiRead": function () {
                    mail.channel.vent.trigger("mail:markAs", {label: 'read'});
                },
                "click @ui.ddiUnread": function () {
                    mail.channel.vent.trigger("mail:markAs", {label: 'unread'});
                },
                "click @ui.ddiImp": function () {
                    mail.channel.vent.trigger("mail:markAs", {label: 'important'});
                },
                "click @ui.ddiNotImp": function () {
                    mail.channel.vent.trigger("mail:markAs", { label: 'unimportant'});
                },
                "click @ui.ddiStarred": function () {
                    mail.channel.vent.trigger("mail:markAs", {label: 'starred'});
                },
                "click @ui.ddiNotStarred": function () {
                    mail.channel.vent.trigger("mail:markAs", {label: 'unstarred'});
                }
            },

            //-----------------------------------------------------------

            initialize: function (options) {

                this.mails = mail.channel.reqres.request("mail:collection");
                this._bindEvents();
            },

            //-----------------------------------------------------------

            _bindEvents:function(){
                this.listenTo(this.mails, "change:items update:success change:selection", this.setDropDownItems, this);
            },

            //------------------------------------------------------------

            setDropDownItems:function(){

                var items = this.itemsToShow();

                this.ui.ddiStarred.toggleBlock(items.stared);
                this.ui.ddiNotStarred.toggleBlock(items["not-stared"]);
                this.ui.ddiImp.toggleBlock(items.important);
                this.ui.ddiNotImp.toggleBlock(items["not-important"]);
                this.ui.ddiRead.toggleBlock(items.read);
                this.ui.ddiUnread.toggleBlock(items.unread);
            },

            //------------------------------------------------------------

            itemsToShow:function(){

                var that = this, items = {};

                _.each(this.mails.getSelected(), function (item) {

                    var model = that.mails.get(item);
                    if(model){
                        var labels = model.get("labels");
                        that.updateItemToShow(labels,items);
                    }
                });
                return items;
            },

            //-----------------------------------------------------------

            updateItemToShow:function(labels,items){

                if(_.has(labels,"starred")){
                    items["not-stared"] = true;
                }else{
                    items.stared = true;
                }
                if(_.has(labels,"important")){
                    items["not-important"] = true;
                }else{
                    items.important = true;
                }
                if(_.has(labels,"read")){
                    items.unread = true;
                }else{
                    items.read = true;
                }
            }
        });
    });

    return MoreActionsView;
});