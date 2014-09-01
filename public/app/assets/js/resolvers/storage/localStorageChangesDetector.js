define(function (require) {
    "use strict";

    var localStorageChangesDetector = (function () {

    var cache = [];

    //-----------------------------------------
    // detect
    //-----------------------------------------

    var detect = function (records, url, filters) {

        filters = filters || {};

        var resId = extractIds(records);

        var cacheItem = _.findWhere(cache, {url:url, query:filters.query, page:filters.page});
        if (cacheItem &&_.isEqual(resId, cacheItem.res)) {
            return false;
        }

        updateCache(url, filters.query, filters.page, resId);
        return true;
    };

    //---------------------------------------

    var extractIds = function (records) {

        var res = [];

        _.each(records, function (record) {
            res.push(record.id);
        });

        return res;
    };

    //----------------------------------

    var updateCache = function (url, query, page, resIds) {

        var cacheItem = _.where(cache, {url:url, query:query, page:page});

        if (!_.isEmpty(cacheItem)) {
            cacheItem.res = resIds;
        }else{
            cache.push({
                url:url,
                query:query,
                page:page,
                res:resIds
            });
        }
    };

    //------------------------------;----

    return{
        detect: detect
    };
})();

return localStorageChangesDetector;
});


