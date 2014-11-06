define(['jquery', 'underscore', "squire", "tests/setup/testUtils"], function ($, _, Squire, testUtils) {
    "use strict";

    var SquirePlus = function (options) {
        options = options || {};

        var spies = {};
        var squire = new Squire();


        //-------------------------------------------------
        // mock handling
        //--------------------------------------------------

        var mock = function (path, mock, spyName) {

            var mockWrapper = mock;

            if(_.isFunction(mock)){

                if (_.isString(spyName) && !_.isEmpty(spyName)) {
                    spies[spyName] = mock;
                    mock = sinon.spy(spies, spyName);
                }
                mockWrapper = function () {
                    return mock;
                };
            }
            squire.mock(path, mockWrapper);
        };


        //--------------------------------------------------
        // blanket  handling
        //--------------------------------------------------

        var require = function () {
            var args = [].slice.apply(arguments);
            args[0].push("mocks");
            squire.units = args[0];

            // It's important to add the coverage prefix only after setting context.units, for the dependency whitelist
            // filter to work correctly (see reqContext.Module.prototype.fetch)
//            if(testUtils.isCodeCoverageEnabled()) {
//                // Load the module using the coverage plugin
//                args[0] = _.map(args[0], function(path){
//                    if(path === "mocks") return path;
//                    return "coverage!" + path;
//                });
//            }

            squire.require.apply(squire, args);

            return this;
        };

        return {
            mock: mock,
            require:require
        };
    };

    return SquirePlus;
});