define(function (require) {
    "use strict";

    var BaseCollection = require("assets-base-objects/collections/baseCollection");

    var FilteredCollection = BaseCollection.extend({

        PAGE_SIZE: 5,

        filters:{
            query:'',
            page:1
        },

        //-------------------------------------------------
        // fetchBy
        //-------------------------------------------------

        fetchBy: function (options) {

            var that = this;

            this.setFilters(options.filters);

            this.fetch({

                reset:true,

                data: {filters: this.filters},

                success: function(collection){
                    that.isFetched = true;
                    if (_.isFunction(options.success)) {
                        options.success(collection);
                    }
                },

                error: function(collection){
                    if (_.isFunction(options.error)) {
                        options.error(collection);
                    }
                }
            });
        },

        //------------------------------------------------

        setFilters:function(filters){

            filters = filters || {};

            this.filters.query = filters.query || 'label:inbox';
            this.filters.page = filters.page || this.metadata.currPage;
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