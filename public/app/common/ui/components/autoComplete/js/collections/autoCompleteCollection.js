define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var AutoCompleteModel = require("common-ui-component/autoComplete/js/models/autoCompleteModel");

    var AutoCompleteCollection = Backbone.Collection.extend({

        model: AutoCompleteModel
    });

    return AutoCompleteCollection;
});