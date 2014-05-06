define(function (require) {
    "use strict";

    var app = require("mbApp");
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
                bccInputWrapper: ".bccInputWrapper",
                inputSubject: ".subject",
                inputEditor: ".compose-editor",
                header:".compose-header",
                ccLine: '.ccLine',
                sendBtn:".sendBtn",
                closeBtn:".closeBtn"
            },

            events: {
                "click .closeBtn": "onCloseBtnClick",
                "click .sendBtn": "onSendClick",
                "change .subject": "onSubjectChange",
                "blur .compose-editor": "onBodyBlur"
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

                this.toView.addDefaultAddress("demo", "demo@mailbone.com");
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

                var val = this.ui.inputSubject.val()
                this.model.set('subject', val);

                var msg = !_.isEmpty(val) ? val : "New Message";
                mail.vent.trigger("change:mailSubject",msg);
            },

            //-------------------------------------------------------

            onBodyBlur: function(){
                this.model.set('body',this.ui.inputEditor.html());
            },

            //-------------------------------------------------------

            onSendClick:function(){
              mail.vent.trigger("mail:send",this.model);
            },

            //-------------------------------------------------------

            onCloseBtnClick:function(){
                mail.vent.trigger("mail:discard",this.model);
            }
        });
    });

    return ComposeView;
});