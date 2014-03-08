define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/tags/templates/tag.tmpl");

    var TagItemView = Marionette.ItemView.extend({
        template:template,
        className:'tag'
     });

    return TagItemView;
});