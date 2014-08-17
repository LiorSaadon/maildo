define(function (require) {
    "use strict";

    var localStorageChangesDetector = function () {

    var cache = [];

    //-----------------------------------------
    // detect
    //-----------------------------------------

    var detect = function (url, records, filters) {

        filters = filters || {};

//        var aid = urlParam(url, 'aid');
//        var sid = urlParam(url, 'sid');

        var isValid =  _.isString(filters.query) && _.isFinite(filters.page);  //_.isString('aid') && _.isString(sid) &&
        if(!isValid){
            return false;
        }

        var resId = extractIds(records);

        var item = _.where(cache, {query:filters.query, page:filters.page});  //sid: sid, aid:aid,
        if (item &&_.isEqual(resId, item.res)) {
            return false;
        }

        updateCache(filters.query, filters.page, resId); //aid, sid,
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

    var updateCache = function (query, page, resIds) {    //aid, sid,

        var item = _.where(cache, {query:query, page:page});   //sid: sid, aid:aid,
        if (item) {
            item.res = resIds;
        }else{
            cache.push({
//                sid: sid,
//                aid:aid,
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
};

return localStorageChangesDetector;
});


