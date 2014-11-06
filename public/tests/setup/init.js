require(["app/assets/config/config.require"], function (baseConfig) {
    "use strict";

    requirejs.config(baseConfig);

    require(["tests/setup/registerTest", "tests/setup/testUtils", "tests/setup/squirePlus"], function (registerTest, testUtils, squirePlus) {

        mocha.setup("bdd");

        chai.should();
        window.assert = chai.assert;

        var testName = testUtils.getTestName();
        require([registerTest[testName].path]);
    });
});