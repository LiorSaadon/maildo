define(function (require) {
    "use strict";

    var TestUtils = (function () {

        var getParameterByName = function (name) {

            name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
                results = regex.exec(location.search);

            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        };

        //----------------------------------------------------------

        var getTestName = function () {
            return getParameterByName("testName");
        };

        //----------------------------------------------------------

        var isCodeCoverageEnabled = function() {
            return getParameterByName("coverage") === "true";
        };

        return {
            getTestName:getTestName,
            isCodeCoverageEnabled:isCodeCoverageEnabled
        };

    }());
    return TestUtils;
});