define(function (require) {
    "use strict";

    var tmpl = require("tmpl");

    var TemplateCache = (function () {

        var AS = {
            TEXT:"text",
            COMPILED:"compiled",
            RENDERER:"renderer"
        };

        var cache = { };

        var exists = function (name) {
            if (cache[name]) {
                return true;
            }

            return false;
        };

        var flush = function () {
            cache = { };
        };

        var purge = function (name) {
            if (cache[name]) {
                delete cache[name];
            }
        };

        var get = function (name, as) {
            if (cache[name] && cache[name][as]) {
                return cache[name][as];
            }

            return null;
        };

        var asText = function (name) {
            return get(name, AS.TEXT);
        };

        var asCompiled = function (name) {
            return get(name, AS.COMPILED);
        };

        var asRenderer = function (name) {
            return get(name, AS.RENDERER);
        };

        var add = function (name, text, purge, as) {
            if (purge || !exists(name)) {
                cache[name] = {};
                cache[name][AS.TEXT] = text;
                cache[name][AS.COMPILED] = tmpl.compile(cache[name][AS.TEXT]);
                cache[name][AS.RENDERER] = function (data, partials) {
                    return cache[name][AS.COMPILED].render(data, partials);
                };
            }

            as = as || AS.TEXT;

            return get(name, as);
        };

        return {
            AS:AS,
            exists:function (name) {
                return exists(name);
            },
            flush:function () {
                return flush();
            },
            purge:function (name) {
                return purge(name);
            },
            get:function (name, as) {
                return get(name, as);
            },
            asText:function (name) {
                return asText(name);
            },
            asCompiled:function (name) {
                return asCompiled(name);
            },
            asRenderer:function (name) {
                return asRenderer(name);
            },
            add:function (name, text, purge, as) {
                return add(name, text, purge, as);
            }
        };

    }());

    return TemplateCache;
});