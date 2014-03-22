define({

    "paths": {
        "underscore": "lib/lodash/lodash",
        "underscore.deepExtend":"lib/lodash/underscore.mixin.deepExtend",
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
        "mbApp": "app/starter/mbApp",
        "tpl": "lib/require/require.tpl",
        "css": "lib/require/require.css",
        "i18n":"app/assets/js/resolvers/i18n",
        "tmpl":"app/assets/js/resolvers/template/tmpl",
        "templateCache":"app/assets/js/resolvers/template/templateCache",
        "lib-extensions":"app/assets/js/lib-extensions",
        "requirejs-plugins":"app/assets/js/lib-extensions/requirejs",
        "assets-data":"app/assets/data",
        "assets-resolvers-guid":"app/assets/js/resolvers/guid/guid",
        "assets-collections":"app/assets/js/extenders/collections",
        "assets-resolvers-url":"app/assets/js/resolvers/url",
        "assets-base-objects":"app/assets/js/base-objects",
        "assets-decorators":"app/assets/js/decorators",
        "assets-resolvers-storage":"app/assets/js/resolvers/storage",
        "assets-resolvers-ui":"app/assets/js/resolvers/ui",
        "assets-resolvers-date":"app/assets/js/resolvers/date",
        "contactsApp": "app/modules/contacts",
        "assets-ui-component":"app/assets/ui/components",
        "assets-plugins":"app/assets/js/plugins",
        "dev.mockjax":"lib/mockjax/jquery.mockjax",
        "dev.mockjson":"lib/mockjson/jquery.mockjson"
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
        "dev.mockjax":{
            // Exports the global $.mockjax object
            "exports":"$.mockjax",
            // Depends on jquery
            "deps":["jquery"]
        },
        // MockJSON
        "dev.mockjson":{
            // Exports the global $.mockjson object
            "exports":"$.mockjson",
            // Depends on jquery
            "deps":["jquery"]
        }
    }
});
