define(['jquery', 'underscore', "squire/squire"], function ($, _, Squire) {
    "use strict";


    var Squire1 = function (options) {
        options = options || {};

        var spies = {};
        var context = new Squire();

        var addDependencyMock = function (path, mock) {
            if (mock) {
                context.mock(path, mock);
            } else if ("object" === typeof(path)) {
                context.mock(path);
            } else {
                context.store(path);
            }

            return mock;
        };

        /**
         * What does this crazy method do: it takes an object and prepare it to be used as an injected dependency. Since
         * we use squire to inject modules when loading them with requirejs, we need to wrap the injected module object
         * with a function:
         *
         * function () {
         *   return myDependencyModules;
         * }
         *
         * Sometimes we define the injected mock module as an object, and in that case we must wrap it twice so we can
         * instantiate it using 'new':
         *
         * function() {
         *   return function() {
         *      return myDependencyObject;
         *   }
         * }
         *
         * Additionally, this method create a spy wrapper using sinon when the spyName option is set. The spy can be later
         * accessed using environment.spies[spyName].
         *
         * @param options: {obj, spyName}
         * @returns {Function}
         */
        var constructs = function (options) {
            options = options || {};

            if (!options.obj) {
                options.obj = options;
            }

            var step1, step2;

            if (options.obj.prototype) {
                step1 = options.obj;
                _.each((new options.obj()), function (val, key) {
                    step1[key] = val;
                });
            }
            else {
                step1 = function () {
                    return options.obj;
                };
                _.each(options.obj, function (val, key) {
                    step1[key] = val;
                });
            }

            // Wrap step1 with spy using sinon
            if (options.spyName) {
                spies[options.spyName] = step1;
                step1 = sinon.spy(spies, options.spyName);
            }

            step2 = function () {
                return step1;
            };

            return step2;
        };


        //blanket
        var require = function () {
            var args = [].slice.apply(arguments);
            args[0].push("mocks");
            context.units = args[0];

            // It's important to add the coverage prefix only after setting context.units, for the dependency whitelist
            // filter to work correctly (see reqContext.Module.prototype.fetch)
            if(options.codeCoverageEnabled) {
                // Load the module using the coverage plugin
                args[0] = _.map(args[0], function(path){
                    if(path === "mocks") return path;
                    return "coverage!" + path;
                });
            }

            context.require.apply(context, args);

            return this;
        };

        return {
            require:require,
            constructs:constructs,
            addDependencyMock: addDependencyMock
        };
    };

    return Squire1;
});