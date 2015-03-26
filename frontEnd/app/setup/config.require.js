define({

    leVersion: "@@version",
    locale: "en-us",
    deps: [],
    waitSeconds: 0,
    "paths": {
        "underscore": "vendor/underscore/underscore",
        "underscore.string": "vendor/underscore/underscore.string",
        "underscore.deepExtend": "vendor/underscore/underscore.mixin.deepExtend",
        "jquery": "vendor/jquery/jquery",
        "backbone": "vendor/backbone/backbone",
        "backbone.wreqr": "vendor/backbone/backbone.wreqr",
        "backbone.babysitter": "vendor/backbone/backbone.babysitter",
        "backbone.sync": "vendor/backbone/backbone.sync",
        "backbone.deepmodel": "vendor/backbone/backbone.deepmodel",
        "marionette": "vendor/backbone/backbone.marionette",
        "socketio": 'vendor/socket.io/socket.io',
        "text": "vendor/require/require.text",
        "json": "vendor/require/require.json",
        "coverage": "vendor/require/require.coverage",
        "mustache": "vendor/mustache/mustache",
        "sinon":"vendor/sinon/sinon",
        "squire":"vendor/squire/squire",
        "mbApp": "app/setup/app",
        "tpl": "vendor/require/require.tpl",
        "css": "vendor/require/require.css",
        "onDemandLoader": "vendor/require/require.loadOnDemand",
        "tmpl": "vendor/require/tmpl",
        "templateCache": "vendor/require/templateCache",

        "mocha": "vendor/mocha/mocha",
        "chai"          : "vendor/chai/cjai",
        'chai-jquery'   : 'vendor/chai/chai-jquery',

        "ui-components":"app/common/ui/components",
        "base-collections": "app/common/js/base-collections",
        "base-models": "app/common/js/base-models",
        "decorators": "app/common/js/decorators",
        "resolvers": "app/common/js/resolvers",
        "plugins": "app/common/js/plugins",
        "extensions": "app/common/js/lib-extensions",
        "i18n": "app/common/js/resolvers/i18n",
        "common-data":"app/common/data",

        "mail-module": "app/modules/mail/mail",
        "tasks-module": "app/modules/tasks/tasks",

        "frame":"app/frame/frame",
        "frame-views":  "app/frame/js/views",
        "frame-templates":"app/frame/ui/templates",
        "frame-controllers":"app/frame/js/controllers",
        "frame-collections":"app/frame/js/collections",
        "frame-models":"app/frame/js/models",
        "frame-storage":"app/frame/js/storage",
        "common": "app/common/js",
        "common-settings": "app/common/js/settings",
        "common-context": "app/common/js/context",

        "mailApp": "app/modules/mail",
        "mail-data": "app/modules/mail/data",
        "mail-views": "app/modules/mail/js/views",
        "mail-templates":"app/modules/mail/ui/templates",
        "mail-routers":"app/modules/mail/js/routers",
        "mail-models":"app/modules/mail/js/models",
        "mail-controllers":"app/modules/mail/js/controllers",
        "mail-mocks":"app/modules/mail/mocks",
        "mail-collections":"app/modules/mail/js/collections",
        "mail-storage":"app/modules/mail/js/storage",
        "mail-utils":"app/modules/mail/js/utils",

        "tasks": "app/modules/tasks",
        "tasks-data":"app/modules/tasks/data",
        "tasks-models": "app/modules/tasks/js/models",
        "tasks-collections": "app/modules/tasks/js/collections",
        "tasks-views": "app/modules/tasks/js/views",
        "tasks-templates":"app/modules/tasks/ui/templates",
        "tasks-controllers":"app/modules/tasks/js/controllers",
        "tasks-routers":"app/modules/tasks/js/routers",
        "tasks-storage":"app/modules/tasks/js/storage",

        "test-pp":"../../tests"
    },
    "shim": {
        'socketio': {
            exports: 'io'
        }
    },
    tpl: {
        "templateExtension": ""
    }
});
