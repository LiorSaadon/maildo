/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/starter/config"], function (baseConfig) {

    "use strict";

    requirejs.config(baseConfig);

    require(["app/starter/requirejsConfigs"], function () {

        require(["mbApp"], function (app) {

            require(["app/main/main"], function () {

                app.start();
            });
        });
    });
});






