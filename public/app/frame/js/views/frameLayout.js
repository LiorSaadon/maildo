define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");

    var FrameLayout = Marionette.Layout.extend({
        template:frameTemplate,
        regions:{
            techbar:".techbar-region",
            main:".main-region"
        }
    });

    return FrameLayout;
});
