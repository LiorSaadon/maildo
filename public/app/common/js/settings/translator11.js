define(function (require) {
    "use strict";

    var _ = require("underscore");

    var Translator = (function () {

        var dictionary = {};

        var setDictionary = function(_dictionary){
            dictionary = _dictionary;
        };

        var translate = function (key) {
            var text = "[??" + key + "??]";

            if (_.isObject(dictionary) && _.isString(key) && _.has(dictionary, key)) {
                text = dictionary[key];
            }

            return text;
        };

        return {
            dictionary : dictionary,
            translate : translate
        };

    })();

    return Translator;
});
