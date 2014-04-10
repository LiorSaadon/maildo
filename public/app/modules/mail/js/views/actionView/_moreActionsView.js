define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/moreActionsView.tmpl");

    require("assets-plugins/blocks.toggle");

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

                this.listenTo(this.collection, "fetch:success", this.setDropDownItems, this);
                this.listenTo(this.collection, "update:success", this.setDropDownItems, this);
                this.listenTo(this.collection, "change:selection", this.setDropDownItems, this);
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
            }
        });
    });

    return MoreActionsView;
});