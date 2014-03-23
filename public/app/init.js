/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/starters/requirejsConfigs"], function (parsedConfig) {

    requirejs.config(parsedConfig);

    require(["mbApp"], function (app) {

        require(["app/starters/appStarter"], function () {

            app.start();
        });
    });
});






