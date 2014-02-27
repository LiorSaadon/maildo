define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!assets-ui-component/autoComplete/templates/autoComplete.tmpl");
    var AutoCompleteItemView = require("assets-ui-component/autoComplete/views/autoCompleteItemView");

    var  AutoCompleteCompositeView = Marionette.CompositeView.extend({
        template : template,
        itemView : AutoCompleteItemView,
        itemViewContainer : "ul"
    });
    return AutoCompleteCompositeView;
});