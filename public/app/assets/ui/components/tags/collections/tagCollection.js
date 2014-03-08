define(function (require) {
    "use strict";

    var Backbone = require("backbone");
    var TagModel = require("assets-ui-component/tags/models/tagModel");

    var TagsCollection = Backbone.Collection.extend({
        model : TagModel
    });

    return TagsCollection;
});

