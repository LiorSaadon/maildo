define(function (require) {
    "use strict";

    var _ = require("underscore");

    var Translator = (function () {

        var dictionary = {};

        var updateDictionary = function(obj){
            $.extend(dictionary, obj);
        };

        //--------------------------------------------

        var translate = function (key) {

            var text = "[?" + key + "?]";

            if (_.isString(key)) {

                var subkeys = key.split(":");

                if(subkeys.length == 2){

                    if(_.has(dictionary, subkeys[0])){

                        text = dictionary[subkeys[0]][subkeys[1]];
                    }
                }
            }
            return text;
        };

        return {
            dictionary : dictionary,
            translate : translate,
            updateDictionary:updateDictionary
        };

    })();

    return Translator;
});
