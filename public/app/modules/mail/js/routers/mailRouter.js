define(function (require) {
    "use strict";

    var app = require("mbApp");
    var MailRouter = {};

    app.module('mail', function (mail, app, Backbone, Marionette, $, _) {

        MailRouter = Marionette.AppRouter.extend({

            appRoutes: {
                "": "inbox",
                "inbox": "inbox",
                "inbox/:param": "inbox",
                "draft": "draft",
                "draft/:param": "draft",
                "sent": "sent",
                "sent/:param": "sent",
                "trash": "trash",
                "trash/:param": "trash",
                "spam": "spam",
                "spam/:param": "spam",
                "search/:param1": "search",
                "search/:param1/:param2": "search",
                "settings": "settings",
                "compose": "compose"
            },

            //---------------------------------------------

            initialize:function(options){
                this.controller = options.controller;
            },

            //---------------------------------------------

            route: function (route, name, callback) {
                return Backbone.Router.prototype.route.call(this, route, name, function () {
                    this.before();
                    callback.apply(this, arguments);
                });
            },

            //---------------------------------------------

            before: function () {
                this.controller.beforeRoute();
            },

            //---------------------------------------------

            previous: function () {
                var prevURL = this.controller.buildPrevURL();
                mail.router.navigate(prevURL, {trigger: true});
            },

            //----------------------------------------------

            fixUrl: function(options){

            }
        });
    });

    return MailRouter;
});
