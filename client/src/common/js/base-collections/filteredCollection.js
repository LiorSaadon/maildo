"use strict";

var BaseCollection = require("./baseCollection");

var FilteredCollection = BaseCollection.extend({

    PAGE_SIZE: 10,

    initialize: function (options) {

        BaseCollection.prototype.initialize(options);
        this.setFilters(options);
    },

    //-------------------------------------------------
    // fetchBy
    //-------------------------------------------------

    fetchBy: function (options) {

        options = options || {};

        this.setFilters(options);

        this.fetch({

            reset: true,

            data: this.filters,

            success: _.bind(function (collection) {
                this.isFetched = true;
                if (_.isFunction(options.success)) {
                    options.success(collection);
                }
            }, this),

            error: function (collection) {
                if (_.isFunction(options.error)) {
                    options.error(collection);
                }
            }
        });
    },

    //-------------------------------------------------

    setFilters: function (options) {

        options = options || {};
        this.filters = options.filters ? _.clone(options.filters) : {query: '', page: 1};
    },

    //-------------------------------------------------
    // refresh
    //-------------------------------------------------

    refresh: function () {

        this.fetchBy({filters: this.filters});
    }
});

module.exports = FilteredCollection;