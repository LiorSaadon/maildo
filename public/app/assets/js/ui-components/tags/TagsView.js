define(function (require) {
    "use strict";

    var Marionette = require("marionette");
    var template = require("tpl!app/assets/ui/templates/ui-components/tags.tmpl");

    var TagsView = Marionette.ItemView.extend({

        template : template,
        className: 'tagsView'
    });

    return TagsView;
});
