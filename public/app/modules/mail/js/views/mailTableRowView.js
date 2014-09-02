define(function (require) {
    "use strict";

    var app = require("mbApp");
    var formatter = require("assets-resolvers/formatter");
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

            triggers: {
                "click .star": "click",
                "click .importance": "click",
                "click .address": "click",
                "click .content": "click",
                "click .sentTime": "click"
            },

            events: {
                "click .selector": "onRowSelect"
            },

            modelEvents: {
                "change:subject" : "_onSubjectChanged",
                "change:body" : "_onBodyChanged"
            },

            initialize: function (options) {

                this.action = app.context.get("mail.action.type");
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
                    isSearch: this.action === "search",

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

                mail.channel.vent.trigger("mailTable:ItemClicked", null);
                this.model.collection.toggleSelection(this.model, {callerName: 'itemView'});
            },

            //-------------------------------------------------------------

            onRowClick: function () {

                this.trigger("childview:click", this);
            },

            //-------------------------------------------------------------

            markAsClicked: function (clicked) {

                this.$el.toggleClass('clickedRow', clicked);
            }
        });
    });
    return MailTableRowView;
});