define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var TagModel = require("common-ui-component/tags/js/models/tagModel");

    var TagsCollection = Backbone.Collection.extend({
        model : TagModel
    });

    return TagsCollection;
});

