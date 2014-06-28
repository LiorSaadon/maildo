define(function (require) {
    "use strict";

    //============================================================
    // FilterCollectionDecorator
    //============================================================

    var FilterCollectionDecorator = function (original, filterModel) {

        var filterCollection = $.extend({}, original);

        filterCollection.models = [];
        filterCollection.filterModel = filterModel;

        //------------------------------------------------
        // filterBy
        //------------------------------------------------

        filterCollection.filterBy = function (options) {

            var items, options = options || {};

            if (this.filterModel) {
                items = _.filter(original.models, _.bind(function (model) {
                    return this.filterModel.filterBy(model);
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
            filterCollection.reset(items);
        };


        //------------------------------------------------
        // filterAll
        //------------------------------------------------

        filterCollection.filterAll = function () {

            filterCollection.reset([]);
        };

        return filterCollection;
    };

    return FilterCollectionDecorator;
});