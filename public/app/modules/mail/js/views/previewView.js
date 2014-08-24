define(function (require) {
    "use strict";

    var app = require("mbApp");
    var formatter = require("mail-utils/formatter");
    var template = require("tpl!mail-templates/previewView.tmpl");

    var PreviewView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        PreviewView = Marionette.ItemView.extend({
            template:template,

            ui:{
                subject:".subject",
                to:".to",
                from:".from",
                body: ".body"

            },

            initialize: function(){

                this.mailCollection = mail.dataController.getMailCollection();
                this.listenTo(this.mailCollection, "change:selection", this.onSelectionChange);
            },

            //-------------------------------------------------------------

            customTemplateHelpers : function () {

                return{
                    subject: formatter.formatSubject(this.model.get("subject")),
                    to: formatter.formatAddresses(this.model.getOutgoingAddresses()),
                    from: formatter.formatAddresses(this.model.getIngoingAddresses())
                };
            },

            //-----------------------------------------------------------

            onRender:function(){

                if(this.model.has("relatedBody")){
                    require(["onDemandLoader!text!app/assets/data/mail1.txt"], _.bind(function (text) {
                       this.ui.body.html(text);
                    },this));
                }else{
                    this.ui.body.html(this.model.get("body"));
                }
            },

            //-----------------------------------------------------------

            onSelectionChange:function(){

                var selected = this.mailCollection.getSelected().length;
                this.$el.toggle(selected === 0);
            }
        });
    });

    return PreviewView;
});