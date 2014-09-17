define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailModel = require("mail-models/mailModel");
    var template = require("tpl!mail-templates/composeView.tmpl");
    var AddressView = require("mail-views/composeView/_addressView");

    var ComposeView ={};

    app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {
        ComposeView = Marionette.ItemView.extend({
            template: template,
            className: 'composeView',

            ui: {
                toInputWrapper: ".toInputWrapper",
                ccInputWrapper: ".ccInputWrapper",
                inputSubject: ".subject",
                inputEditor: ".compose-editor",
                header:".compose-header",
                ccLine: '.ccLine',
                sendBtn:".sendBtn",
                closeBtn:".closeBtn"
            },

            events: {
                "click  @ui.closeBtn": "onCloseBtnClick",
                "click  @ui.sendBtn": "onSendClick",
                "change @ui.inputSubject": "onSubjectChange",
                "blur   @ui.inputEditor": "onEditorBlur",
                "click  @ui.toInputWrapper": "onToInputWrapperClick",
                "click  @ui.ccInputWrapper": "onCcInputWrapperClick"
            },

            modelEvents:{
              change:"onModelChange"
            },

            //------------------------------------------------------

            initialize:function(options){

                this.contacts = options.contacts;
            },

            //------------------------------------------------------
            // onRender
            //------------------------------------------------------

            onRender: function () {

                this.renderToView();
                this.renderCcView();
             },

            //-------------------------------------------------------

            renderToView:function(){

                this.toView = new AddressView({
                    model:this.model,
                    modelAttr:'to',
                    el: this.ui.toInputWrapper
                });
                this.toView.render();
            },

            //-------------------------------------------------------

            renderCcView:function(){

                this.ccView = new AddressView({
                    model:this.model,
                    modelAttr:'cc',
                    el: this.ui.ccInputWrapper
                });
                this.ccView.render();
            },

            //-------------------------------------------------------
            // events handlers
            //-------------------------------------------------------

            onSubjectChange: function(){

                var val = this.ui.inputSubject.val();
                this.model.set('subject', val);
            },

            //-------------------------------------------------------

            onEditorBlur: function(){
                this.model.set('body',this.ui.inputEditor.html());
            },

            //-------------------------------------------------------

            onSendClick:function(){
                mail.channel.vent.trigger("mail:send",this.model);
            },

            //-------------------------------------------------------

            onCloseBtnClick:function(){
                mail.channel.vent.trigger("mail:discard",this.model);
            },

            //-------------------------------------------------------

            onToInputWrapperClick:function(){
                this.ui.toInputWrapper.removeClass("error");
            },

            //-------------------------------------------------------

            onCcInputWrapperClick:function(){
                this.ui.ccInputWrapper.removeClass("error");
            },

            //-------------------------------------------------------

            onModelChange:function(){
                mail.channel.vent.trigger("mail:change",this.model);
            },

            //-------------------------------------------------------

            onInvalid:function(model, error){

                switch(error){
                    case MailModel.Errors.NoRecipient: case MailModel.Errors.InvalidToAddress:
                        this.ui.toInputWrapper.addClass("error");
                        break;
                    case MailModel.Errors.InvalidCcAddress:
                        this.ui.ccInputWrapper.addClass("error");
                        break;
                }
            }
        });
    });

    return ComposeView;
});