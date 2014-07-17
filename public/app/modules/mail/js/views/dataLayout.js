define(function (require) {
    "use strict";

    var app = require("mbApp");
    var layoutTemplate = require("tpl!mail-templates/dataLayout.tmpl");

    var DataLayout = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        DataLayout = Marionette.LayoutView.extend({
            template:layoutTemplate,
            regions:{
                itemsRegion:".mail-items-region",
                previewRegion:".mail-preview-region",
                messageBoard:".mail-message-board-region"
            },

            initialize:function(){
                this.isPermanent = true;
                this.listenTo(this.messageBoard,"before:show", this.onMessageBoardShow);
            },

            onMessageBoardShow:function(){
                this.messageBoard.$el.css("z-index","2");
                this.messageBoard.$el.css("display","block");
            }
        });
    });

    return DataLayout;
});