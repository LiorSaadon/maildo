define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/mailTable.tmpl");
    var EmptyView = require("mail-views/messagesView");
    var MailableRowView = require("mail-views/mailTableRowView");

    var MailTableView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MailTableView = Marionette.CompositeView.extend({
            name:'mailTable',
            template : template,
            childView : MailableRowView,
            childViewContainer : "tbody",

            initialize:function(options){

                options = options || {};

                this.action = options.action || "inbox";
                this.listenTo(mail.vent, "mailTable:ItemClicked", this.onItemClicked, this);
                this.listenTo(this.collection, "change:selection", this.onSelectionChange, this);
            },

            //-------------------------------------------------------
            // buildChildView
            //-------------------------------------------------------

            buildChildView : function (item, ItemView) {

                var view = new ItemView({
                    action: this.action,
                    model : item
                });
                return view;
            },

            //-------------------------------------------------------
            // onSelectionChange
            //-------------------------------------------------------

            onSelectionChange: function(options){

                options = options || {};

                if(options.callerName !== 'itemView'){

                    this.children.each(function(view){

                        view.setSelection();
                    });
                }
            },

            //--------------------------------------------------

            onItemClicked:function(_itemView){

                this.children.each(function(itemView){
                    itemView.markAsClicked(false);
                });

                if(_itemView){
                   _itemView.markAsClicked(true);
                }
            }
        });
    });
    return MailTableView;
});