define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var frameTemplate = require("tpl!frame-templates/frameLayout.tmpl");

    var FrameLayout = Marionette.Layout.extend({
        template:frameTemplate,
        regions:{
            techbarRegion:".techbar-region",
            mainRegion:".main-region"
        }
    });

    return FrameLayout;
});
