define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/mailTableRow.tmpl");
    var dateResolver = require("assets-resolvers-date/dateResolver");

    var MailTableRowView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MailTableRowView = Marionette.ItemView.extend({
            template:template,
            tagName:'tr',
            className:'inbox_row',

            ui:{
                checkBox: ".chkBox",
                selector: ".selector",
                starIcon:".starIcon",
                impIcon:".importantIcon",
                adress: ".address",
                subject: ".subject",
                sentTime: ".sentTime"
            },

            events:{
                "click .selector":"swapSelection",
                "click .from":"onRowClick",
                "click .subject":"onRowClick",
                "click .sentTime":"onRowClick"
            },

            //------------------------------------------------

            initialize:function(options){

               options = options || {};

               this.action = options.action || "inbox";
               this.listenTo(this.model, "change:labels.*" , this.setIcons);
            },

            //-------------------------------------------------------------
            // customTemplateHelpers
            //-------------------------------------------------------------

            customTemplateHelpers : function () {

                return {
                    isInbox:  this.action === "inbox",
                    isSent:   this.action === "sent",
                    isDraft:  this.action === "draft",
                    isTrash:  this.action === "trash",
                    iaSpam:   this.action === "spam"
                };
            },

            //-------------------------------------------------------------
            // onRender
            //-------------------------------------------------------------

            onRender:function(){

                this.setIcons();
                this.setSubject();
                this.setDate();
                this.setSelection();
            },

            //-------------------------------------------------------------

            setIcons:function(){

                var labels = this.model.get("labels");

                this.$el.toggleClass("unread",_.has(labels,'read'));
                this.ui.starIcon.toggleClass("disable",!_.has(labels,'starred'));
                this.ui.impIcon.toggleClass("disable",!_.has(labels,'important'));
            },

            //-------------------------------------------------------------

            setSelection:function() {

                var isSelected = this.model.collection.isSelected(this.model);

                this.$el.toggleClass('selected',isSelected);
                this.ui.checkBox.prop('checked',isSelected);
            },

            //-------------------------------------------------------------

            setSubject:function(){

                var subject = this.model.get("subject");

                if(_.isEmpty(subject)){
                    subject = "(" + app.translator.translate("mail.nosubject") + ")";
                }
                this.ui.subject.text(subject);
            },

            //-------------------------------------------------------------

            setDate:function(){

                this.ui.sentTime.text(dateResolver.shortDate(this.model.get("sentTime")));
            },

            //-------------------------------------------------------------
            // onRowClick
            //-------------------------------------------------------------

            onRowClick:function(){

                var state = app.context.get("router.state");
                var search = state.params.query ? "/" + state.params.query : "";
                //mail.router.navigate(state.action + search + "/" + this.model.id, { trigger: true });
            },

            //------------------------------------------------

            swapSelection:function () {

                var isSelected = this.model.collection.isSelected(this.model);

                this.$el.toggleClass('selected',isSelected);
                this.ui.checkBox.prop('checked',isSelected);
                this.model.collection.toggleSelection(this.model, {callerName:'itemView'});
            }
        });
    });
    return MailTableRowView;
});