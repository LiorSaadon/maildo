define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var TagModel = Backbone.Model.extend({
        defaults: {
            text: "",
            value: "",
            isValid: true
        }
    });

    return TagModel;
});