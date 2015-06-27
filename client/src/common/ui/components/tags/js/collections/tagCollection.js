"use strict";

var TagModel = require("ui-components/tags/js/models/tagModel");

var TagsCollection = Backbone.Collection.extend({
    model: TagModel
});

module.exports = TagsCollection;

