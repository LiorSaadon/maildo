define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/messagesView.tmpl");

    var MessagesView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MessagesView = Marionette.ItemView.extend({
            template:template,

            ui:{
              "msgTitle":".msgTitle"
            },

            initialize:function(options){
                options = options || {};
                this.msg = options.msg;
            },

            onRender:function(){
              this.ui.msgTitle.html(this.msg);
            }
        });
    });

    return MessagesView;
});