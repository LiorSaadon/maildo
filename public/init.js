/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["configs"], function (fullConfig) {

    requirejs.config(fullConfig);

    require(["mbApp"], function (app) {

        require(["app/appStarter"], function () {

            app.start();
        });
    });
});






