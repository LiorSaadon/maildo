define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var AutoCompleteModel = require("assets-ui-component/autoComplete/js/models/autoCompleteModel");

    var AutoCompleteCollection = Backbone.Collection.extend({

        model: AutoCompleteModel
    });

    return AutoCompleteCollection;
});