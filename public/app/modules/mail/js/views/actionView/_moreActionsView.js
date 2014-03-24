define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/moreActionsView.tmpl");

    var MoreActionsView = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {
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
                "click .markRead": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'read'});
                },
                "click .markUnread": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'unread'});
                },
                "click .markImp": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'important'});
                },
                "click .markNotImp": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'notImportant'});
                },
                "click .addStar": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'starred'});
                },
                "click .removeStar": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'notStarred'});
                },
                "click .btnDiscard": function () {
                    mail.vent.trigger("newMail", {actionType: 'discard'});
                }
            },

            //-----------------------------------------------------------

            initialize: function (options) {

                this.collection = mail.dataController.getMailCollection();
                this.listenTo(this.collection, "sync", this.setDropDownItems, this);
                this.listenTo(this.collection, "change:selection", this.setDropDownItems, this);
            },

            //------------------------------------------------------------

            setDropDownItems:function(){

                var items = this.itemsToShow();

                this.showItem(this.ui.ddiStarred, items.stared);
                this.showItem(this.ui.ddiNotStarred, items["not-stared"]);
                this.showItem(this.ui.ddiImp, items.important);
                this.showItem(this.ui.ddiNotImp, items["not-important"]);
                this.showItem(this.ui.ddiRead, items.read);
                this.showItem(this.ui.ddiUnread, items.unread);
            },

            //------------------------------------------------------------

            itemsToShow:function(){

                var that = this, items = {};

                _.each(this.collection.getSelected(), function (item) {

                    var model = that.collection.get(item);

                    if(model){

                        var labels = model.get("labels");

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
                return items;
            },

            //-------------------------------------------------------

            showItem:function(uiItem, show){

                if(show){
                    uiItem.css("display", "block");
                }else{
                    uiItem.css("display", "none");
                }
            }
        });
    });

    return MoreActionsView;
});