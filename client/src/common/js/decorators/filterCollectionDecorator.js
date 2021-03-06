"use strict";

var FilterCollectionDecorator = function (original, filterModel) {

    var filterCollection = $.extend({}, original);

    filterCollection.models = [];
    filterCollection.filterModel = filterModel;

    //------------------------------------------------
    // filterBy
    //------------------------------------------------

    filterCollection.filterBy = function (options) {

        options = options || {};

        var items;

        if (this.filterModel) {
            items = _.filter(original.models, _.bind(function (model) {
                return this.filterModel.predicate(model);
            }, this));
        } else {
            items = original.models;
        }

        if (_.isArray(options.mandatoryItems)) {
            items = _.union(options.mandatoryItems, items);
        }

        if (_.isFinite(options.maxItems)) {
            items = items.slice(0, options.maxItems);
        }

        if (_.isEmpty(items)) {
            filterCollection.trigger("empty:collection");
        }
        filterCollection.reset(items);
    };


    //------------------------------------------------
    // filterAll
    //------------------------------------------------

    filterCollection.filterAll = function () {

        filterCollection.trigger("empty:collection");
        filterCollection.reset([]);
    };

    return filterCollection;
};

module.exports = FilterCollectionDecorator;
