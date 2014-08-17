define(function (require) {
    "use strict";

    var BaseCollection = require("assets-collections/BaseCollection");
    var FilteredCollection = require("assets-collections/FilteredCollection");

    var PersistentCollection = FilteredCollection.extend({

        //-------------------------------------------------
        // persist
        //-------------------------------------------------

        persist: function (options) {

            options = options || {};

            var that = this;
            var fetchInterval = options.fetchInterval || 10000;

            var recall = function(){

                setTimeout(function () {
                    that.persist.call(that,options);
                }, fetchInterval);
            };

            var onSuccess = function (collection, resp, reqOptions) {

                that.fetched = true;
                if (_.isFunction(options.success)) {
                    options.success(collection, resp, reqOptions);
                }
                recall();
            };

            var onError = function (collection, resp, reqOptions) {

                if (_.isFunction(options.error)) {
                    options.error(collection, resp, reqOptions);
                }
                recall();
            };

            //----------------------------------------------

            if(!this.validFilters()){
                recall();
            }else{
                this.fetch({
                    data: $.extend({}, {filters: this.filters, persist: true}),
                    success: onSuccess,
                    error: onError
                });
            }
        },

        //-------------------------------------------------
        // set
        //-------------------------------------------------

        set: function (response, options) {

            if (_.isObject(response) && _.isObject(response.metadata)) {

                if (response.metadata.status !== 'nochange') {
                    BaseCollection.prototype.set.call(this, response, options);
                }
            }
        }
    });

    return  PersistentCollection;
});
