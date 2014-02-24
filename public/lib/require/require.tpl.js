/** @license
 * RequireJS plugin for loading mustache files without adding the .mustache extension, useful for
 * using templates of mustache but with a different file extension and with resource that already contain a file
 * extension or that shouldn't have one.
 * Author: Itai Koren
 * Version: 0.0.1 (2013/03/06)
 * Released under the MIT license
 */
define(['templateCache', 'text'], function (cache, text) {
    "use strict";

    var DEFAULT_EXTENSION = '.mustache';
    var TEXT_FLAG = '!text';
    var COMPILED_FLAG = '!compiled';
    var RENDERER_FLAG = '!renderer';
    var RELOAD_FLAG = '!reload';

    /*
     * Actual plugin code
     **/
    var buildMap = {};

    var onTemplateLoad = function (name, split, onLoad) {
        if (name.indexOf(TEXT_FLAG) !== -1) {
            onLoad(cache.asText(split[0]));
        } else if (name.indexOf(RENDERER_FLAG) !== -1) {
            onLoad(cache.asRenderer(split[0]));
        } else {
            onLoad(cache.asCompiled(split[0]));
        }
    };

    // API
    return {
        load:function (name, req, onLoad, config) {
            var tplConfig = config.tpl || {};
            var split = name.split('!');
            var ext = tplConfig  && tplConfig.templateExtension != null ? tplConfig.templateExtension : DEFAULT_EXTENSION;
            var fullName = split[0] + ext;
            var reload = (name.indexOf(RELOAD_FLAG) !== -1);

            if (!config.isBuild && cache.exists(split[0]) && !reload) {
                onTemplateLoad(name, split, onLoad);

                return;
            } else {
                // Do not bother with the work if a build and templates will
                // not be inlined.
                if (config.isBuild && !config.inlineTemplates) {
                    onLoad();
                    return;
                }

                // The text plugin knows how to load files in node, rhino, and the browser, so let it do the hard work
                text.get(req.toUrl(fullName), function (data) {
                    cache.add(split[0], data, reload);
                    if (config.isBuild) {
                        // store compiled function if build
                        // and should always be a string
                        buildMap[name] = cache.asText(split[0]);
                    }

                    onTemplateLoad(name, split, onLoad);
                });
            }
        },

        //write method based on RequireJS official text plugin by James Burke
        //https://github.com/jrburke/requirejs/blob/master/text.js
        write:function (pluginName, moduleName, write) {
            if (moduleName in buildMap) {
                var content = buildMap[moduleName];
                var split = moduleName.split('!');
                var buildTemplateText = 'define("' + pluginName + '!' + moduleName + '", ["templateCache"], function(cache){ var text = \'' +
                                        content.replace(/'/g, "\\'").replace(/(\n|\r\n)/g, function (a) {
                                            return a.toString().replace(/\r/g, "\\r").replace(/\n/g, "\\n") + "'; text+='"
                                        }) + '\'; cache.add(\'' + split[0] + '\', text);';

                if (moduleName.indexOf(TEXT_FLAG) !== -1) {
                    buildTemplateText += ' return cache.asText(\'' + split[0] + '\');';
                } else if (moduleName.indexOf(RENDERER_FLAG) !== -1) {
                    buildTemplateText += ' return cache.asRenderer(\'' + split[0] + '\');';
                } else {
                    buildTemplateText += ' return cache.asCompiled(\'' + split[0] + '\');';
                }

                buildTemplateText += ' });\n';

                write(buildTemplateText);
            }
        }
    };
});