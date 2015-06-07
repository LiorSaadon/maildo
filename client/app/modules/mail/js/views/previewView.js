define(function (require) {
    "use strict";

    var app = require("mbApp");
    var formatter = require("resolvers/formatter");
    var template = require("tpl!mail-templates/previewView.tmpl");

    var PreviewView = {};

    app.module('mail', function (mail, app,  Backbone, Marionette, $, _) {

        PreviewView = Marionette.ItemView.extend({
            template:template,

            ui:{
                subject:".subject",
                to:".to",
                from:".from",
                body:".body"
            },

            initialize: function () {

                this.contacts = mail.channel.reqres.request("contact:collection");
            },

            //-------------------------------------------------------------

            customTemplateHelpers : function () {

                return{
                    subject: formatter.formatSubject(this.model.get("subject")),
                    to: formatter.formatAddresses(this.contacts.getTitles(this.model.getOutgoingAddresses())),
                    from: formatter.formatAddresses(this.contacts.getTitles(this.model.getIngoingAddresses()))
                };
            },

            //-----------------------------------------------------------

            onRender:function(){

                this.ui.body.html(this.model.get("body"));
            }
        });
    });

    return PreviewView;
});