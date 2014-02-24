define(function (require) {
    "use strict";

    var Marionette = require("marionette");


    //============================================================
    // GridViewCollectionDecorator
    //============================================================


    var FilterCollectionDecorator = function (original) {

        var filterCollection = $.extend({}, original);

        filterCollection.models = [];

        //------------------------------------------------
        // filterBy
        //------------------------------------------------

        filterCollection.filterBy = function (_filterModel) {

            var items, that = this;

            //-----------------------------------------

            if(_.isObject(_filterModel)){
                this.filterModel = _filterModel;
            }

            if (this.filterModel) {
                items = _.filter(original.models, function (model) {
                    return that.filterModel.pluck(model);
                });
            } else {
                items = original.models;
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