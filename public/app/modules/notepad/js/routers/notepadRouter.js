define(function (require) {
    "use strict";

    var app = require("mbApp");
    var NotepadRouter = {};

    app.module('notepad', function (notepad, app, Backbone, Marionette, $, _) {

        NotepadRouter = Marionette.AppRouter.extend({

            appRoutes: {
                "newnote": "newNote"
            },

            //---------------------------------------------
            // route
            //---------------------------------------------

            route: function (route, name, callback) {
                return Backbone.Router.prototype.route.call(this, route, name, function () {
                    this.before();
                    callback.apply(this, arguments);
                });
            },

            //---------------------------------------------
            // before
            //---------------------------------------------

            before: function () {
                app.frame.changeSubLayout("notepad");
            }
        });
    });

    return NotepadRouter;
});

