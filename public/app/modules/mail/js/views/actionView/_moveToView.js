define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");
    var template = require("tpl!mail-templates/moveToView.tmpl");

    var MoreView = {};

    app.module('mail', function (mail, mb, Backbone, Marionette, $, _) {
        MoreView = Marionette.ItemView.extend({

            template: template,
            className: 'moveToView',

            ui: {
                ddiInbox:".moveToInbox",
                ddiTrash:".moveToTrash",
                ddiSpam :".moveToSpam"
            },

            events: {
                "click .moveToInbox": function () {
                    mail.vent.trigger("actions", {actionType: 'moveTo', target: 'inbox'});
                },
                "click .moveToTrash": function () {
                    mail.vent.trigger("actions", {actionType: 'moveTo', target: 'trash'});
                },
                "click .moveToSpam": function () {
                    mail.vent.trigger("actions", {actionType: 'moveTo', target: 'spam'});
                }
            },

            //-----------------------------------------------------------

            initialize: function (options) {

                this.collection = mail.dataController.getMailCollection();
                this.listenTo(app.context, 'change:router.state', this.showRelevantItems, this);
            },

            //-----------------------------------------------------------

            showRelevantItems: function(){

                this.currentContext = app.context.get("router.state.action");

                switch (this.currentContext) {
                    case "inbox":
                        this.ui.ddiInbox.css("display", "none");
                        this.ui.ddiSpam.css("display", "block");  //ddiSpam.show() set 'display:inline' for <a> tag.
                        this.ui.ddiTrash.css("display", "block");
                        break;
                    case "trash":
                        this.ui.ddiInbox.css("display", "block");
                        this.ui.ddiSpam.css("display", "block");
                        this.ui.ddiTrash.css("display", "none");
                        break;
                    default:
                        this.ui.ddiInbox.css("display", "block");
                        this.ui.ddiSpam.css("display", "none");
                        this.ui.ddiTrash.css("display", "none");
                }
            }
        });
    });

    return MoreView;
});