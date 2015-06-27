"use strict";

var AutoCompleteModel = Backbone.Model.extend({

    default: {
        text: "",
        value: ""
    },

    //---------------------------------------------------\

    initialize: function (obj, options) {

        if (_.isString(obj.text)) {
            this.set("text", obj.text.toLowerCase());
        }
        if (_.isString(obj.value)) {
            this.set("value", obj.value.toLowerCase());
        }
    }
});
module.exports = AutoCompleteModel;
