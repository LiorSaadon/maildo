define(function (require) {
    "use strict";

    var BaseCollection = require("assets-base-objects/collections/BaseCollection");
    var FilteredCollection = require("assets-base-objects/collections/FilteredCollection");

    var PersistentCollection = FilteredCollection.extend({

        //-------------------------------------------------
        // persist
        //-------------------------------------------------

        persist: function (_options) {

            var that = this;
            var options = _options || {};
            var fetchInterval = options.fetchInterval || 60000;
            var filters = this.filters ? _.clone(this.filters) : {};

            this.fetch({

                data: $.extend({}, this.filters, {persist: true}),

                success: function (collection, resp, bbOptions) {

                    that.fetched = true;

                    if (_.isEqual(that.filters,filters)) {
                        if (_.isFunction(options.success)) {
                            options.success(collection, resp, bbOptions);
                        }
                    }
                    setTimeout(function () {
                        that.persist(options);
                    }, fetchInterval);
                },

                error: function (collection, resp, bbOptions) {

                    if (_.isEqual(that.filters,filters)) {
                        if (_.isFunction(options.error)) {
                            options.error(collection, resp, bbOptions);
                        }
                    }
                    setTimeout(function () {
                        that.persist(options);
                    }, fetchInterval);
                }
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
