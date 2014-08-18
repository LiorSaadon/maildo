define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/mailTable.tmpl");
    var MailableRowView = require("mail-views/mailTableRowView");

    var MailTableView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MailTableView = Marionette.CompositeView.extend({
            name:'mailTable',
            template : template,
            childView : MailableRowView,
            childViewContainer : "tbody",

            initialize:function(options){

                this.listenTo(this, "childview:click", this._handleChildClick);
                this.listenTo(this.collection, "change:selection", this.onSelectionChange, this);
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

            _handleChildClick:function(_itemView){

                this.children.each(function(itemView){
                    itemView.markAsClicked(false);
                });

                if(_itemView){
                   _itemView.markAsClicked(true);
                    mail.channel.vent.trigger("mailTable:ItemClicked", _itemView.model);
                }
            }
        });
    });
    return MailTableView;
});