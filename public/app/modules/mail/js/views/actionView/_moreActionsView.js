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
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'unimportant'});
                },
                "click .addStar": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'starred'});
                },
                "click .removeStar": function () {
                    mail.vent.trigger("actions", {actionType: 'markAs', label: 'unstarred'});
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

                this.toggle(this.ui.ddiStarred, items.stared);
                this.toggle(this.ui.ddiNotStarred, items["not-stared"]);
                this.toggle(this.ui.ddiImp, items.important);
                this.toggle(this.ui.ddiNotImp, items["not-important"]);
                this.toggle(this.ui.ddiRead, items.read);
                this.toggle(this.ui.ddiUnread, items.unread);
            },

            //------------------------------------------------------------

            itemsToShow:function(){

                var that = this, items = {};

                _.each(this.collection.getSelected(), function (item) {

                    var model = that.collection.get(item);
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
            },

            //-------------------------------------------------------

            toggle:function(uiItem, show){

               uiItem.css("display", show ? "block" : "none");
            }
        });
    });

    return MoreActionsView;
});