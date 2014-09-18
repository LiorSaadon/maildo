define(function (require) {
    "use strict";

    var app = require("mbApp");
    var Marionette = require("marionette");

    var AppRouter = Marionette.AppRouter.extend({

        routes : {
            "*notFound": "notFound"
        },

        notFound:function(){
            app.router.navigate("inbox",{trigger: true});
        }
    });

    return AppRouter;
});
