define({

    "paths": {
        "underscore": "lib/lodash/lodash",
        "underscore.deepExtend": "lib/lodash/underscore.mixin.deepExtend",
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
        "mbApp": "app/starters/app",
        "tpl": "lib/require/require.tpl",
        "css": "lib/require/require.css",
        "i18n": "app/common/js/resolvers/i18n",
        "tmpl": "app/common/js/resolvers/template/tmpl",
        "templateCache": "app/common/js/resolvers/template/templateCache",
        "lib-extensions": "app/common/js/lib-extensions",
        "common-data": "app/common/data",
        "common-storage": "app/common/js/storage",
        "common-controllers": "app/common/js/controllers",
        "common-resolvers-guid": "app/common/js/resolvers/guid/guid",
        "common-collections": "app/common/js/collections",
        "common-models": "app/common/js/models",
        "common-resolvers-url": "app/common/js/resolvers/url",
        "common-decorators": "app/common/js/decorators",
        "common-resolvers-storage": "app/common/js/resolvers/storage",
        "common-resolvers-ui": "app/common/js/resolvers/ui",
        "common-resolvers-date": "app/common/js/resolvers/date",
        "common-ui-component": "app/common/ui/components",
        "common-plugins": "app/common/js/plugins",
        "contactsApp": "app/modules/contacts",
        "dev.mockjax": "lib/mockjax/jquery.mockjax",
        "dev.mockjson": "lib/mockjson/jquery.mockjson"
    },
    "shim": {
        "underscore": {
            "exports": "_"
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
        },
        // MockJax
        "dev.mockjax": {
            // Exports the global $.mockjax object
            "exports": "$.mockjax",
            // Depends on jquery
            "deps": ["jquery"]
        },
        // MockJSON
        "dev.mockjson": {
            // Exports the global $.mockjson object
            "exports": "$.mockjson",
            // Depends on jquery
            "deps": ["jquery"]
        }
    }
});
