define(function (require) {
    "use strict";

    var app = require("mbApp");
    var formatter = require("mail-utils/formatter");
    var template = require("tpl!mail-templates/mailTableRow.tmpl");

    var MailTableRowView = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailTableRowView = Marionette.ItemView.extend({
            template: template,
            tagName: 'tr',
            className: 'inbox_row',

            ui: {
                checkBox: ".chkBox",
                selector: ".selector",
                starIcon: ".star-icon",
                impIcon: ".importance-icon",
                address: ".address",
                subject: ".subject",
                body: ".body",
                sentTime: ".sentTime"
            },

            events: {
                "click .selector": "onRowSelect",
                "click .star": "onRowClick",
                "click .importance": "onRowClick",
                "click .address": "onRowClick",
                "click .content": "onRowClick",
                "click .sentTime": "onRowClick"
            },

            modelEvents: {
                "change:subject" : "_onSubjectChanged",
                "change:body" : "_onBodyChanged"
            },


            initialize: function (options) {

                options = options || {};

                this.action = options.action || "inbox";
                this.listenTo(this.model, "change:labels.*", this.toggleUI);
            },

            //-------------------------------------------------------------
            // customTemplateHelpers
            //-------------------------------------------------------------

            customTemplateHelpers: function () {

                return{
                    isInbox: this.action === "inbox",
                    isSent: this.action === "sent",
                    isDraft:  this.action=== "draft",
                    isTrash: this.action === "trash",
                    isSpam: this.action === "spam",

                    body: formatter.formatContent(this.model.get("body")),
                    subject: formatter.formatSubject(this.model.get("subject")),
                    sentTime: formatter.formatShortDate(this.model.get("sentTime")),
                    to: formatter.formatAddresses(this.model.getOutgoingAddresses()),
                    from: formatter.formatAddresses(this.model.getIngoingAddresses())
                };
            },

            //-------------------------------------------------------------
            // onRender
            //-------------------------------------------------------------

            onRender: function () {

                this.toggleUI();
                this.setSelection();
            },

            //-------------------------------------------------------------

            toggleUI: function () {

                var labels = this.model.get("labels");

                this.ui.sentTime.toggleClass("unread", !_.has(labels, 'read'));
                this.ui.address.toggleClass("unread", !_.has(labels, 'read'));
                this.ui.subject.toggleClass("unread", !_.has(labels, 'read'));
                this.ui.starIcon.toggleClass("disable", !_.has(labels, 'starred'));
                this.ui.impIcon.toggleClass("disable", !_.has(labels, 'important'));
            },

            //------------------------------------------------

            setSelection: function () {

                var selected = this.model.collection.isSelected(this.model);

                this.$el.toggleClass('selected', selected);
                this.ui.checkBox.prop('checked', selected);
            },

            //-------------------------------------------------------------
            // dataChanged
            //-------------------------------------------------------------

            _onSubjectChanged:function(){

                this.ui.subject.text(formatter.formatSubject(this.model.get("subject")));
            },

            //-------------------------------------------------------------

            _onBodyChanged:function(){

                this.ui.body.text(formatter.formatSubject(this.model.get("body")));
            },

            //-------------------------------------------------------------
            // rowEvents
            //-------------------------------------------------------------

            onRowSelect: function () {

                mail.vent.trigger("mailTable:ItemClicked", null);
                this.model.collection.toggleSelection(this.model, {callerName: 'itemView'});
            },

            //-------------------------------------------------------------

            onRowClick: function () {

                mail.vent.trigger("mailTable:ItemClicked", this);
            },

            //-------------------------------------------------------------

            markAsClicked: function (clicked) {

                this.$el.toggleClass('clickedRow', clicked);
            }
        });
    });
    return MailTableRowView;
});