define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var mainTemplate = require("tpl!main-templates/mainLayout.tmpl");

    var MainLayout = Marionette.Layout.extend({
        template:mainTemplate,
        regions:{
            techbar:".techbar-region",
            main:".main-region"
        }
    });

    return MainLayout;
});
