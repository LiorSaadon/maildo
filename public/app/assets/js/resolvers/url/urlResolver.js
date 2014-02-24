define(function (require) {
    "use strict";

    var app = require("mbApp");

    var URLResolver = (function () {

        var getUrl = function (resource) {

            resource += "?aid=" + app.login.info.accountId;
            resource += "&sid=" + app.login.info.sessionId;

            return resource;
        };

        return {
            getUrl: getUrl
        };
    }());

    return URLResolver;
});
