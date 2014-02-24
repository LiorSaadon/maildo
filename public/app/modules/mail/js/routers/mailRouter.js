define(function (require) {
        "use strict";

        var app = require("mbApp");
        var MailRouter = {};

        app.module('mail', function (mail, mb,  Backbone, Marionette, $, _) {

            MailRouter = Marionette.AppRouter.extend({

                appRoutes: {
                    "": "inbox",
                    "inbox": "inbox",
                    "inbox/:param": "inbox",
                    "draft":"draft",
                    "draft/:param": "draft",
                    "sent":"sent",
                    "sent/:param": "sent",
                    "trash":"trash",
                    "trash/:param": "trash",
                    "spam":"spam",
                    "spam/:param": "spam",
                    "compose":"compose",
                    "search/:param1":"search",
                    "search/:param1/:param2":"search",
                    "settings":"settings"
                },

                //---------------------------------------------
                // route
                //---------------------------------------------

                route: function(route, name, callback) {
                    return Backbone.Router.prototype.route.call(this, route, name, function() {
                        this.before();
                        callback.apply(this, arguments);
                    });
                },

                //---------------------------------------------
                // before
                //---------------------------------------------

                before: function(){
                    app.mail.routerController.backupState();
                    app.layoutController.changeSubLayout("mail");
                },

                //---------------------------------------------
                // previous
                //---------------------------------------------

                previous: function() {
                    var prevURL = app.mail.routerController.getPrevURL();
                    mail.router.navigate(prevURL,{trigger: true });
                }
            });
        });

        return MailRouter;
});
