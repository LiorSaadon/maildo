require(["app/assets/config/config.require"], function (baseConfig) {
    "use strict";

    requirejs.config(baseConfig);

    require(["tests/setup/registerTests", "tests/setup/utils", "tests/setup/squirePlus"], function (registerTest, utils, squirePlus) {

        mocha.setup("bdd");

        chai.should();
        window.assert = chai.assert;

        var testName = utils.getTestName();
        require([registerTest[testName].path]);
    });
});