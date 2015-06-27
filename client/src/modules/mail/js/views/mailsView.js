"use strict";

var app = require("app");
var template = require("mail-templates/mailsView.hbs");
var MailableRowView = require("mail-views/mailItemView");

var MailTableView = {};

app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

    MailTableView = Marionette.CompositeView.extend({
        name: 'mailTable',
        template: template,
        childView: MailableRowView,
        childViewContainer: "tbody",

        initialize: function () {

            this.listenTo(this, "childview:click", this._handleChildClick);
            this.listenTo(this.collection, "change:selection", this.onSelectionChange, this);
        },

        //-------------------------------------------------------
        // onSelectionChange
        //-------------------------------------------------------

        onSelectionChange: function (options) {

            options = options || {};

            if (options.callerName !== 'itemView') {
                this.children.each(_.bind(function (view) {
                    view.setSelection();
                    view.markAsClicked(this.collection.getSelected().length === 0 && view === this.clickedItem);
                }, this));
            }
        },

        //-------------------------------------------------------

        _handleChildClick: function (_itemView) {

            this.children.each(function (itemView) {
                itemView.markAsClicked(false);
            });

            if (_itemView) {
                this.clickedItem = _itemView;
                this.clickedItem.markAsClicked(true);
                mail.channel.vent.trigger("mailTable:ItemClicked", this.clickedItem.model);
            }
        }
    });
});
module.exports = MailTableView;
