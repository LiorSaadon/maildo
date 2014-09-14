define(function (require) {
    "use strict";

    var app = require("mbApp");
    var BaseCollection = require("mailbone-base-collections/baseCollection");

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

            app.channel.vent.trigger("data:refresh:before",this);

            this.fetch({

                reset:true,

                data: {filters: this.filters},

                success: _.bind(function(collection){
                    this.isFetched = true;
                    app.channel.vent.trigger("data:refresh:success",this);
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