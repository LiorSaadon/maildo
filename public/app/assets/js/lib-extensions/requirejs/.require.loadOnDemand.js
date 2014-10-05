define(function () {
    "use strict";

    return {
        load : function (name, req, onload, config) {
            if (config.isBuild) { // for build process don't inline the requested file
                onload(null);
            } else {
                req([name], function () { // for dev-opt versions request the given file
                    onload(arguments[0]);
                });
            }
        }
    };
});
