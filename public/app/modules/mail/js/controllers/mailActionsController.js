define(function (require) {
    "use strict";

    var app = require("mbApp");

    var ActionsController = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {

        ActionsController = Marionette.Controller.extend({

            initialize: function () {

                this.collection = mail.dataController.mails;
                this.listenTo( mail.vent, 'actions', this.actions, this);
            },

            //----------------------------------------------------
            // actions
            //----------------------------------------------------

            actions: function (options) {

                switch (options.actionType) {

                    case 'selectAll': this.selectAll();break;
                    case 'selectNone': this.unselectAll();break;
                    case 'selectRead': this.selectRead();break;
                    case 'selectUnread': this.selectUnread();break;
                    case "delete": this.deleteItem();break;
                    case "markAs": this.markAs(options);break;
                    case "moveTo": this.moveTo(options);break;
                }
            },

            //----------------------------------------------------
            // select functions
            //----------------------------------------------------

            selectAll: function () {
                var selectedItems = [];

                _.each(this.collection.models, function (model) {
                    selectedItems.push(model);
                }, this);

                this.collection.selectModels(selectedItems, {exclusively: true});
            },

            //----------------------------------------------------

            unselectAll: function () {

                this.collection.clearSelected();
            },

            //----------------------------------------------------

            selectRead: function () {
                var selectedItems = [];

                _.each(this.collection.models, function (model) {
                    var labels = model.get('labels');
                    if (_.has(labels, 'read')) {
                        selectedItems.push(model);
                    }
                }, this);

                this.collection.selectModels(selectedItems, {exclusively: true});
            },

            //----------------------------------------------------

            selectUnread: function () {
                var selectedItems = [];

                _.each(this.collection.models, function (model) {
                    var labels = model.get('labels');
                    if (!_.has(labels, 'read')){
                        selectedItems.push(model);
                    }
                }, this);

                this.collection.selectModels(selectedItems, {exclusively: true});
            },

            //----------------------------------------------------
            // markAs
            //----------------------------------------------------\

            markAs: function (options) {

                var that = this, items = this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get(item);
                    if(model){
                        switch (options.label) {
                            case 'read':model.addLabel('read');break;
                            case 'unread':model.removeLabel('read');break;
                            case 'important':model.addLabel('important');break;
                            case 'notImportant':model.removeLabel('important');break;
                            case 'starred':model.addLabel('starred');break;
                            case 'notStarred':model.removeLabel('starred');break;
                        }
                    }
                });
                this.updateCollection(items,true);
            },

            //----------------------------------------------------
            // moveTo
            //----------------------------------------------------

            moveTo: function (options) {

                var that = this, items = this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get( item);
                    if(model){
                        model.replaceLabel(model.get("in"), options.target);
                        model.set("in", options.target);
                    }
                });

                this.updateCollection(items);
            },

            //----------------------------------------------------

            deleteItem: function () {

                var that = this, items = this.collection.getSelected();

                _.each(items, function (item) {

                    var model = that.collection.get( item);
                    if(model){
                        model.removeAllLabels({silent:true});
                        model.addLabel("trash");
                        model.set("in","trash");
                    }
                });

                this.updateCollection(items);
            },

            //----------------------------------------------------
            // updateCollection
            //----------------------------------------------------

            updateCollection: function (items, silent) {

                var that = this;

                this.collection.update({

                    selectedItems: items,
                    fields: ['id', 'labels', 'in'],

                    success: function () {
                        if( !silent){
                            that.collection.refresh();
                        }
                    }
                });
            }
        });
    });
    return ActionsController;
});
