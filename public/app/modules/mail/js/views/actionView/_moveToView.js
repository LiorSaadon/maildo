define(function (require) {
    "use strict";

    var app = require("mbApp");
    var template = require("tpl!mail-templates/moveToView.tmpl");

    require("mailbone-plugins/toggle.block");

    var MoreView = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {
        MoreView = Marionette.ItemView.extend({

            template: template,
            className: 'moveToView',

            ui: {
                ddiInbox:".moveToInbox",
                ddiTrash:".moveToTrash",
                ddiSpam :".moveToSpam"
            },

            events: {
                "click @ui.ddiInbox": function () {
                    mail.channel.vent.trigger("mail:moveTo", {target: 'inbox'});
                },
                "click @ui.ddiTrash": function () {
                    mail.channel.vent.trigger("mail:moveTo", {target: 'trash'});
                },
                "click @ui.ddiSpam": function () {
                    mail.channel.vent.trigger("mail:moveTo", {target: 'spam'});
                }
            },

            //-----------------------------------------------------------

            initialize: function () {

                this.listenTo(app.context, 'change:mail.action', this.showRelevantItems, this);
            },

            //-----------------------------------------------------------

            showRelevantItems: function(){

                this.currAction = app.context.get("mail.action.type");

                this.ui.ddiInbox.toggleBlock(!_.contains(["inbox"],this.currAction));
                this.ui.ddiSpam.toggleBlock(_.contains(["inbox","trash"],this.currAction));
                this.ui.ddiTrash.toggleBlock(_.contains(["spam","inbox"],this.currAction));
            }
        });
    });

    return MoreView;
});