define(function (require) {
    "use strict";

    var app = require("mbApp");
    var _s = require("underscore.string");
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
                starIcon:".star-icon",
                impIcon:".importance-icon",
                address: ".address",
                subject: ".subject",
                body: ".body",
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
               this.listenTo(this.model, "change:labels.*" , this.toggleUI);
            },

            //-------------------------------------------------------------
            // customTemplateHelpers
            //-------------------------------------------------------------

            customTemplateHelpers : function () {

                return{
                    to:      this.formatAddresses(this.model.getOutgoingAddresses()),
                    from:    this.formatAddresses(this.model.getIngoingAddresses()),
                    body:    this.formatContent(),
                    subject: this.formatSubject(),
                    sentTime:this.formatSentTime(),

                    isInbox: this.action === "inbox",
                    isSent:  this.action === "sent",
                    isDraft: this.action === "draft",
                    isTrash: this.action === "trash",
                    isSpam:  this.action === "spam"
                };
            },

           //-------------------------------------------------------------

            formatSubject:function(){

                var subject = this.model.get("subject");

                if(_.isEmpty(subject)){
                    subject = "(" + app.translator.translate("mail.nosubject") + ")";
                }
                return subject;
            },

            //-------------------------------------------------------------

            formatContent: function(){
                return this.model.get("body").replace(/(<([^>]+)>)/ig,"").replace(/&nbsp;/ig," ");
            },

            //-------------------------------------------------------------

            formatSentTime:function(){
                return dateResolver.shortDate(this.model.get("sentTime"));
            },

            //------------------------------------------------------------

            formatAddresses:function(addressList){

                var res = "",
                    titles = mail.dataController.getContactsCollection().getTitles(addressList);

                if(titles.length === 1){
                   return titles[0];
                }
                _.each(titles, function(title){
                    res += _s.strLeftBack(title, " ") + ", ";
                })

                return _s.strLeftBack(res,",");
            },


            //-------------------------------------------------------------
            // onRender
            //-------------------------------------------------------------

            onRender:function(){

                this.toggleUI();
                this.setSelection();
            },

            //-------------------------------------------------------------

            toggleUI:function(){

                var labels = this.model.get("labels");

                this.ui.sentTime.toggleClass("unread",!_.has(labels,'read'));
                this.ui.address.toggleClass("unread",!_.has(labels,'read'));
                this.ui.subject.toggleClass("unread",!_.has(labels,'read'));
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