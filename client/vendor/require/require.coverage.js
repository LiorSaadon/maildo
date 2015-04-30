/**
 * Created with IntelliJ IDEA.
 * User: shlomif
 * Date: 4/17/14
 * Time: 9:18 AM
 *
 * Code coverage requirejs plugin using blanket.js.
 */
define(['text'], function (text) {
    "use strict";

    return {
        load : function (name, req, onLoad, config) {
            if(!blanket) {
                // blanket.js is not loaded - load the resource as is
                req([name], function (value) {
                    onload(value);
                });
            }

            // Instrument the module code using blanket.js
            text.get(req.toUrl(name + ".js"), function(moduleScript){
                    // instrument the code so we can get coverage statistics
                    blanket.instrument({
                        inputFile: moduleScript,
                        inputFileName: name
                    },function(instrumented){
                        onLoad.fromText(instrumented);
                    });
                },
                onLoad.error
            );
        }
    };
});