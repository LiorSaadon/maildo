/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/setup/configs"], function (fullConfig) {

    requirejs.config(fullConfig);

    require(["mbApp"], function (app) {

        require(["app/setup/appStarter"], function () {

            app.start();
        });
    });
});






