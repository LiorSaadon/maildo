define({

    "paths": {
        "underscore": "lib/underscore/underscore",
        "underscore.string": "lib/underscore/underscore.string",
        "underscore.deepExtend": "lib/underscore/underscore.mixin.deepExtend",
        "jquery": "lib/jquery/jquery",
        "backbone": "lib/backbone/backbone",
        "backbone.wreqr": "lib/backbone/backbone.wreqr",
        "backbone.babysitter": "lib/backbone/backbone.babysitter",
        "backbone.localstorage": "lib/backbone/backbone.localstorage",
        "backbone.deepmodel": "lib/backbone/backbone.deepmodel",
        "marionette": "lib/backbone/backbone.marionette",
        "text": "lib/require/require.text",
        "json": "lib/require/require.json",
        "mustache": "lib/mustache/mustache",
        "modernizr": "lib/modernizr/modernizr",
        "mbApp": "app/setup/app",
        "tpl": "lib/require/require.tpl",
        "css": "lib/require/require.css",
        "i18n": "app/assets/js/resolvers/i18n",
        "onDemandLoader":"app/assets/js/lib-extensions/requirejs/require.loadOnDemand",
        "tmpl": "lib/require/tmpl",
        "templateCache": "lib/require/templateCache",
        "lib-extensions": "app/assets/js/lib-extensions",
        "assets-data": "app/assets/data",
        "assets-storage": "app/assets/js/storage",
        "assets-controllers": "app/assets/js/controllers",
        "assets-resolvers-guid": "app/assets/js/resolvers/guid/guid",
        "assets-collections": "app/assets/js/collections",
        "assets-models": "app/assets/js/models",
        "assets-resolvers-url": "app/assets/js/resolvers/url",
        "assets-decorators": "app/assets/js/decorators",
        "assets-resolvers": "app/assets/js/resolvers",
        "assets-resolvers-storage": "app/assets/js/resolvers/storage",
        "assets-resolvers-ui": "app/assets/js/resolvers/ui",
        "assets-resolvers-date": "app/assets/js/resolvers/date",
        "assets-ui-component": "app/assets/ui/components",
        "assets-plugins": "app/assets/js/plugins",
        "dev.mockjax": "lib/mockjax/jquery.mockjax",
        "dev.mockjson": "lib/mockjson/jquery.mockjson"
    },
    "shim": {
        "underscore": {
            "exports": "_"
        },
        "underscore.string": {
            "exports": "_s",
            "deps": ["underscore"]
        },
        "modernizr": {
            "exports": "Modernizr"
        },
        "backbone.localstorage": {
            "exports": "Backbone.LocalStorage",
            "deps": ["backbone"]
        },
        "backbone.deepmodel": {
            "exports": "Backbone.DeepModel",
            "deps": ["backbone"]
        }
    }
});
