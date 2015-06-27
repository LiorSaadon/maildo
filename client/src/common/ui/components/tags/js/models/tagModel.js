"use strict";

var TagModel = Backbone.Model.extend({
    defaults: {
        text: "",
        value: "",
        isValid: true
    }
});

module.exports = TagModel;
