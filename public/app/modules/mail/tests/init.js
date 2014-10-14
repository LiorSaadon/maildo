require(["app/assets/config/config.require"], function (baseConfig) {
    "use strict";

    requirejs.config(baseConfig);

    require(["app/modules/mail/tests/registerTest", "assets-resolvers/QUnitHelper"], function (registerTest, QUnitHelper) {

        var testName = QUnitHelper.getQueryString ("testName");
        require([registerTest[testName].path], function () {
            alert("yoffi.....");
        });
    });
});