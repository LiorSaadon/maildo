define(function (require) {
    "use strict";

    var Backbone = require("backbone");

    var TagModel = Backbone.Model.extend({
        defaults: {
            value: "",
            isValid: true
        }
    });

    return TagModel;
});