define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/emptyMailView.tmpl");

    var EmptyMailView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        EmptyMailView = Marionette.ItemView.extend({
             template:template,
             isPermanent:true,

             ui:{
                 counter:".counter",
                 message:".message"
             },

             initialize: function(){

                 this.mailCollection = mail.dataController.getMailCollection();
                 this.listenTo(this.mailCollection, "change:selection", this.onSelectionChange, this);
             },

             //-----------------------------------------------------------------------

             onSelectionChange : function () {

                var selected = this.mailCollection.getSelected().length;

                this.ui.counter.html(selected);
                this.ui.counter.toggle(selected>0);
                this.ui.message.toggle(selected===0);
             }
        });
    });

    return EmptyMailView;
});
