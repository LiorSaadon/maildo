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
                addCc: '.addCc',
                addBcc: '.addBcc',
                ccLine: '.ccLine',
                bccLine: '.bccLine'
            },

            events: {
                "change .subject": "onSubjectChange",
                "blur .compose-editor": "onBodyBlur",
                "click .addCc": "showCc",
                "click .addBcc": "showBcc"
            },

            //----------------------------------------------------------------

            initialize:function(options){

                this.contacts = options.contacts;
            },

            //------------------------------------------------------
            // onRender
            //------------------------------------------------------

            onRender: function () {

                this.toView = new AddressView({
                    contacts:this.contacts,
                    model:this.model,
                    modelAttr:'to',
                    el: this.ui.toInputWrapper
                });
                this.toView.render();

                this.ccView = new AddressView({
                    contacts:this.contacts,
                    model:this.model,
                    modelAttr:'cc',
                    el: this.ui.ccInputWrapper
                });
                this.ccView.render();

                this.bccView = new AddressView({
                    contacts:this.contacts,
                    model:this.model,
                    modelAttr:'bcc',
                    el: this.ui.bccInputWrapper
                });
                this.bccView.render();
            },

            //-----------------------------------------------------------------

            onSubjectChange: function(){
                this.model.set('subject',this.ui.inputSubject.val());
            },

            //-----------------------------------------------------------------

            onBodyBlur: function(){
                this.model.set('body',this.ui.inputEditor.html());
            },

            //-----------------------------------------------------------------

            showCc: function(){
                this.ui.ccLine.show();
                this.ui.addCc.hide();
                this.ui.inputEditor.css('top', parseInt(this.ui.header.css('height'),10) + 25 + 'px') ;
            },

            //-----------------------------------------------------------------

            showBcc: function(){
                this.ui.bccLine.show();
                this.ui.addBcc.hide();
                this.ui.inputEditor.css('top', parseInt(this.ui.header.css('height'),10) + 25 + 'px') ;
            },

            //-----------------------------------------------------------------

            onInvalid: function (model, errors) {
                alert("5656");
            }
        });
    });

    return ComposeView;
});