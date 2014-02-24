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

                this.listenTo(this.model, "change:labels.*" , this.updateLabels);
            },

            //------------------------------------------------

            onRender:function(){

                this.setSelection();
                this.updateLabels();
            },

            //------------------------------------------------

            customTemplateHelpers : function () {
                return {
                    sentTime : dateResolver.shortDate(this.model.get("sentTime"))
                };
            },

            //------------------------------------------------

            updateLabels:function(){

                var labels = this.model.get("labels");

                if(_.has(labels,'starred')){
                    this.ui.starIcon.removeClass("disable");
                }else{
                    this.ui.starIcon.addClass("disable");
                }

                if(_.has(labels,'important')){
                    this.ui.impIcon.removeClass("disable");
                }else{
                    this.ui.impIcon.addClass("disable");
                }

                if(_.has(labels,'read')){
                    this.$el.removeClass("unread");
                }else{
                    this.$el.addClass("unread");
                }
            },

            //------------------------------------------------

            onRowClick:function(){

                var state = app.context.get("router.state");
                var search = state.params.query ? "/" + state.params.query : "";
                mail.router.navigate(state.action + search + "/" + this.model.id, { trigger: true });
            },

            //------------------------------------------------

            swapSelection:function () {

                var isSelected = this.model.collection.isSelected(this.model);

                if(isSelected){
                    this.$el.removeClass('selected');
                    this.ui.checkBox.prop('checked', false);
                    this.model.collection.unselectModel(this.model, {callerName:'itemView'});
                }else{
                    this.$el.addClass('selected');
                    this.ui.checkBox.prop('checked', true);
                    this.model.collection.selectModel(this.model, {callerName:'itemView'});
                }
            },

            //------------------------------------------------

            setSelection:function() {

                var selected = this.model.collection.isSelected(this.model);

                if(selected){
                    this.$el.addClass('selected');
                    this.ui.checkBox.prop('checked', true);
                }else{
                    this.$el.removeClass('selected');
                    this.ui.checkBox.prop('checked', false);
                }
            }
        });
    });
    return MailTableRowView;
});