define(function (require) {
    "use strict";

    var LocaleResolver = (function () {

        var CONST = {
            "en_US":"en-US",
            "de_DE":"de-DE"
        };

        var currentLang = CONST.en_US;

        var getParamValue = function (variable) {
            // TODO: I'm using this method temporary, this is done only to show how the i18n is working we will need the settings of the language from another location(cookie, localStore... not decided yet)
            var param = currentLang;
            if ("undefined" !== typeof window && "undefined" !== typeof window.location && "undefined" !== typeof window.location.search) {
                var query = window.location.search.substring(1);
                var vars = query.split("&amp;");
                for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    if (pair[0] == variable) {
                        param = pair[1];
                    }
                }
            }
            return param;
        };

        var getLocale = function () {
            var langFromConfig = getParamValue("lang") || currentLang;
            return langFromConfig;
        };

        var setLocale = function (lang) {
            currentLang = lang;
        };

        return {
            CONST:CONST,
            getLocale:getLocale,
            setLocale:setLocale
        };

    }());

    return LocaleResolver;
});
