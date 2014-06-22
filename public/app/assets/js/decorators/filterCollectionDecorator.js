define(function (require) {
    "use strict";

    //============================================================
    // FilterCollectionDecorator
    //============================================================

    var FilterCollectionDecorator = function (original) {

        var filterCollection = $.extend({}, original);

        filterCollection.models = [];

        //------------------------------------------------
        // filterBy
        //------------------------------------------------

        filterCollection.filterBy = function (_filterModel, maxItems) {

            var items, that = this;

            if(_.isObject(_filterModel)){
                this.filterModel = _filterModel;
            }

            if (this.filterModel) {
                items = _.filter(original.models, function (model) {
                    return that.filterModel.filterBy(model);
                });
            } else {
                items = original.models;
            }

            if(_.isFinite(maxItems)){
                items = items.slice(0,maxItems);
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