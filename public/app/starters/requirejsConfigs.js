define(function (require) {
    "use strict";

    var appConfig = require("app/starters/appConfig");
    var configs = require("app/common/js/lib-extensions/requirejs/require.loadByType!config");

    var leVersion = "@@version";

    var parsedConfig = {
        leVersion: leVersion,
        locale: "en-us",
        paths: appConfig.paths,
        shim: appConfig.shim,
        tpl: {
            "templateExtension": ""
        },
        deps: [],
        waitSeconds: 0
    };

    //---------------------------------------------------------

    function extendAppConfig(configs) {

        for (var path in configs.paths) {
            if (path && configs.paths.hasOwnProperty(path) && !parsedConfig.paths.hasOwnProperty(path) && typeof(configs.paths[path]) !== 'function') {
                parsedConfig.paths[path] = configs.paths[path];
            }
        }

        for (var shim in configs.shim) {
            if (shim && configs.shim.hasOwnProperty(shim) && !parsedConfig.shim.hasOwnProperty(shim) && typeof(configs.shim[shim]) !== 'function') {
                parsedConfig.shim[shim] = configs.shim[shim];
            }
        }
    }

    //------------------------------------------------------------
    // merge modules configs.
    //------------------------------------------------------------

    for (var config in configs) {
        if (config && configs.hasOwnProperty(config) && typeof(configs[config]) !== 'function') {
            extendAppConfig(configs[config]);
        }
    }

    return parsedConfig;
});


