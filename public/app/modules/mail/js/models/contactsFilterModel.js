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

        highlightKey: function (key) {

            if (_.isString(key)) {
                return key
                    .replace(new RegExp("^" + this.input, 'gi'), function (str) {
                        return '<b>' + str + '</b>';
                    })
                    .replace(new RegExp(" " + this.input, 'gi'), function (str) {
                        return ' <b>' + _s.strRight(str, ' ') + '</b>';
                    })
                    .replace(new RegExp(":" + this.input, "gi"), function (str) {
                        return ':<b>' + _s.strRight(str, ':') + '</b>';
                    })
                    .replace(new RegExp("@" + this.input, "gi"), function (str) {
                        return '@<b>' + _s.strRight(str, '@') + '</b>';
                    })
                    .replace(new RegExp("\\." + this.input, "gi"), function (str) {
                        return '.<b>' + _s.strRight(str, '.') + '</b>';
                    });
            }
            return key;
        }
    });
    return AutoCompleteFilterModel;
});