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

            initialize: function () {

                this.listenTo(app.context, 'change:router.state', this.showRelevantItems, this);
            },

            //-----------------------------------------------------------

            showRelevantItems: function(){

                this.currAction = app.context.get("router.state.action");

                if(_.contains(["inbox"],this.currAction)){
                    this.ui.ddiInbox.hide();
                }
                if(_.contains(["spam","inbox"],this.currAction)){
                    this.ui.ddiTrash.show();
                }
                if(_.contains(["inbox","trash"],this.currAction)){
                    this.ui.ddiSpam.show();
                }
            }
        });
    });

    return MoreView;
});