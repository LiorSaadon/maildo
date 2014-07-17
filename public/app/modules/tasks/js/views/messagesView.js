define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!tasks-templates/messagesView.tmpl");

    var MessagesView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        MessagesView = Marionette.ItemView.extend({
            template:template,

            ui:{
              "msg":".message"
            },

            initialize:function(options){
                options = options || {};
                this.msg = options.msg
            },

            onRender:function(){
              this.ui.msg.html(this.msg);
            }
        });
    });

    return MessagesView;
});