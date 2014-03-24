define(function (require) {
    "use strict";

    var localStorageChangesDetector = function () {

    var cache = [];

    //-----------------------------------------
    // detect
    //-----------------------------------------

    var detect = function (url, records, filters) {

        filters = filters || {};

        var aid = urlParam(url, 'aid');
        var sid = urlParam(url, 'sid');

        var isValid = _.isString('aid') && _.isString(sid) && _.isString(filters.query) && _.isNumber(filters.page);
        if(!isValid){
            return false;
        }

        var resId = extractIds(records);

        var item = _.where(cache, {sid: sid, aid:aid, query:filters.query, page:filters.page});
        if (item &&_.isEqual(resId, item.res)) {
            return false;
        }

        updateCache(aid, sid, filters.query, filters.page, resId);
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
    //---------------------------------------

    var urlParam = function (url, name) {

        var res = new RegExp(name + '=' + '(.+?)(&|$)').exec(url);
        return (res||[null])[1];
    };

    //----------------------------------

    var updateCache = function (aid, sid, query, page, resIds) {

        var item = _.where(cache, {sid: sid, aid:aid, query:query, page:page});
        if (item) {
            item.res = resIds;
        }else{
            cache.push({
                sid: sid,
                aid:aid,
                query:query,
                page:page,
                res:resIds
            });
        }
    };

    //----------------------------------

    return{
        detect: detect
    };
};

return localStorageChangesDetector;
});


