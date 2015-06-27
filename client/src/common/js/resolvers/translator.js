"use strict";

var Translator = (function () {

    var dictionary = {};

    //--------------------------------------------

    Handlebars.registerHelper("_i18n", function(text) {
        return translate(text);
    });

    //--------------------------------------------

    var updateDictionary = function(obj){
        $.extend(dictionary, obj);
    };

    //--------------------------------------------

    var translate = function (key) {

        if (_.isString(key)) {

            var subkeys = key.split(":");

            if(subkeys.length == 2){

                if(_.has(dictionary, subkeys[0])){

                    return dictionary[subkeys[0]][subkeys[1]];
                }
            }
        }
        return "";
    };

    return {
        dictionary : dictionary,
        translate : translate,
        updateDictionary:updateDictionary
    };

})();

module.exports = Translator;
