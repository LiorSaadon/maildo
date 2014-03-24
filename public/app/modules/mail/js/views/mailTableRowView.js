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
                from: ".from",
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

            initialize:function(){

               this.listenTo(this.model, "change:labels.*" , this.setIcons);
            },

            //------------------------------------------------

            customTemplateHelpers : function () {

                return {
                    sentTime : dateResolver.shortDate(this.model.get("sentTime"))
                };
            },

            //------------------------------------------------

            onRender:function(){

                this.setIcons();
                this.setSelection();
            },

            //------------------------------------------------

            setIcons:function(){

                var labels = this.model.get("labels");

                this.$el.toggleClass("unread",_.has(labels,'read'));
                this.ui.starIcon.toggleClass("disable",!_.has(labels,'starred'));
                this.ui.impIcon.toggleClass("disable",!_.has(labels,'important'));
            },

            //------------------------------------------------

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
            },

            //------------------------------------------------

            setSelection:function() {

                var isSelected = this.model.collection.isSelected(this.model);

                this.$el.toggleClass('selected',isSelected);
                this.ui.checkBox.prop('checked',isSelected);
            }
        });
    });
    return MailTableRowView;
});