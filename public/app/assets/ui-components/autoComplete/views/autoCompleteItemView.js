define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/templates/autoCompleteItem.tmpl");

    var AutoCompleteItemView = Marionette.ItemView.extend({
        template:template,
        tagName:'li',
        className:'inbox_row'
     });

    return AutoCompleteItemView;
});