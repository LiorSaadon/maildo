define(function (require) {
    "use strict";

    var BaseCollection = require("assets-collections/baseCollection");

    var FilteredCollection = BaseCollection.extend({

        PAGE_SIZE: 5,

        initialize:function(options){

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

                data: {filters: this.filters},

                success: _.bind(function(collection){
                    this.isFetched = true;
                    if (_.isFunction(options.success)) {
                        options.success(collection);
                    }
                },this),

                error: function(collection){
                    if (_.isFunction(options.error)) {
                        options.error(collection);
                    }
                }
            });
        },

        //-------------------------------------------------

        setFilters:function(options){

            options = options || {};
            this.filters = options.filters ? _.clone(options.filters) : {query:'',page:1};
        },

        //-------------------------------------------------
        // refresh
        //-------------------------------------------------

        refresh: function () {

            this.fetchBy({filters:this.filters});
        }
    });

    return FilteredCollection;
});