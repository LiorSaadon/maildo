/*
 this is the entry point to the application
 we will load the require configuration and then the application logic
 */
require(["app/assets/config/config.require"], function (config) {

    requirejs.config(config);

    require(["mbApp"], function (app) {

        require(["app/setup/appStarter"], function () {

            app.start();
        });
    });
});






