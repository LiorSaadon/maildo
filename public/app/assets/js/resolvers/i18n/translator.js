define(function (require) {
    "use strict";

    var _ = require("underscore");
    var i18nObjects  = require("requirejs-plugins/require.loadByType!i18n");

    var Translator = (function () {

        var dictionary = {};

        _.each(i18nObjects, function(obj){
            $.extend(dictionary, obj);
        });

        var translate = function (key) {
            var text = "[??" + key + "??]";

            if (_.isPlainObject(dictionary) && _.isString(key) && _.has(dictionary, key)) {
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
