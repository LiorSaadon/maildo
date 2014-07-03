define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var _s = require("underscore.string");

    var AutoCompleteFilterModel = Backbone.Model.extend({

        setInput: function (input) {
            this.input = _.isString(input) ? input.toLowerCase() : "";
        },

        //-----------------------------------------------------------------------

        predicate: function (model) {

            return this.test(model.get("text")) || this.test(model.get("value"));
        },

        //------------------------------------------------------------------------

        test: function (text) {

            var res = false;

            if (_.isString(text)) {

                text = text.toLowerCase();

                res = _s.startsWith(text, this.input) ||
                    _s.contains(text, " " + this.input) ||
                    _s.contains(text, ":" + this.input) ||
                    _s.contains(text, "." + this.input) ||
                    _s.contains(text, "@" + this.input);
            }
            return res;
        },

        //------------------------------------------------------------------------

        emphasizeKeys: function (text) {

            if (_.isString(text)) {
                return text
                    .replace(new RegExp("^" + this.input), "<b>" + this.input + "</b>")
                    .replace(new RegExp(":" + this.input, "g"), ":<b>" + this.input + "</b>")
                    .replace(new RegExp("@" + this.input, "g"), "@<b>" + this.input + "</b>")
                    //.replace(new RegExp("." + this.input, "g"), ".<b>" + this.input + "</b>")
            }
            return text;
        }
    });
    return AutoCompleteFilterModel;
});