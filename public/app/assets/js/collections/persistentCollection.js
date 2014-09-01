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

            //----------------------------------------------

            var onSuccess = function (collection, resp, reqOptions) {

                that.fetched = true;

                if (_.isFunction(options.success)) {
                    options.success(collection, resp, reqOptions);
                }

                setTimeout(function () {
                    that.persist.call(that,options);
                }, fetchInterval);
            };

            //----------------------------------------------

            var onError = function (collection, resp, reqOptions) {

                if (_.isFunction(options.error)) {
                    options.error(collection, resp, reqOptions);
                }
            };

            //----------------------------------------------

            this.fetch({
                data: $.extend({}, {filters: this.filters, persist: true}),
                success: onSuccess,
                error: onError
            });
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
