require(["app/assets/config/config.require"], function (baseConfig) {
    "use strict";

    requirejs.config(baseConfig);

    require(["tests/setup/registerTest", "tests/setup/testUtils"], function (registerTest, testUtils) {

        mocha.setup('bdd');

        var testName = testUtils.getTestName();

        require([registerTest[testName].path], function () {

        });
    });
});