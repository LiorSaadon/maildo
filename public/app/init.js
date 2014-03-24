/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/kick-starters/requirejsConfigs"], function (fullConfig) {

    requirejs.config(fullConfig);

    require(["mbApp"], function (app) {

        require(["app/kick-starters/appStarter"], function () {

            app.start();
        });
    });
});






