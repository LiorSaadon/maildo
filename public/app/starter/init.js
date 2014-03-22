/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/starter/requirejsConfigs"], function (parsedConfig) {

    requirejs.config(parsedConfig);

    require(["mbApp"], function (app) {

        require(["app/main/main"], function () {

            app.start();
        });
    });
});






