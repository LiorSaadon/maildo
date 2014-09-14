define(function (require) {
    "use strict";

    var _s = require("underscore.string");

    var LocalStorageFilterer = function (_orderBy) {

        var pageSize = 5;

        //--------------------------------------------------------
        // filter
        //--------------------------------------------------------


        var filter = function(records, filters, filteringMap){

            var metadata = {};

            records = filterByQuery(records, filters.query, filteringMap);
            records = filterByPage(records,filters.page, metadata);

            return{
                metadata:metadata,
                collection:records
            };
        };

        //--------------------------------------------------------
        // filterByQuery
        //--------------------------------------------------------


        var filterByQuery = function(records, query, filteringMap){

            var subQueries = query.split(' ');

            for(var i=0; i<subQueries.length; i++){

                var q = setQuery(subQueries[i],filteringMap);

                if(_.isString(q.key)){
                    records = filterByTag(q, records);
                }else{
                    records = filterByData(q, records);
                }
            }
            return records;
        };

        //-------------------------------------------------------

        var setQuery = function(query, filteringMap){

            var arr = query.toLowerCase().split(':'), res = {};

            if(arr.length == 2){
               if(filteringMap.fields[arr[0]] === "tag"){
                    res.key = arr[0];
                    res.val = arr[1];
               }
            }else{
                res.val = query;
            }
            return res;
        };

        //-------------------------------------------------------

        var filterByTag = function(query, records){

            return _.reject(records, function (obj) {

                 if(_.isObject(obj[query.key])){
                     return !_.has(obj[query.key],query.val);
                 }
                 else if(_.isString(obj[query.key])){
                     return obj[query.key] === query.val;
                 }
                 return true;
            });
        };

        //----------------------------------------------

        var filterByData = function(query, records){

            var t= _.filter(records, function (obj){

                var res = 0;

                _.each(obj, function(val, key){
                    if(_.isString(obj[key])){
                        res += (obj[key].toLowerCase().indexOf(query.val) > -1) ? 1 : 0;
                    }
                });
                return res > 0;
            });

            return  t;
        };


        //--------------------------------------------------------
        // filterByPage
        //--------------------------------------------------------


        var filterByPage = function(records, page, metadata){

            var range = setRange(records, page);

            metadata.to = range.to;
            metadata.from = range.from;
            metadata.total = records.length;
            metadata.currPage = Math.floor(range.from/pageSize);

            return records.slice(range.from, range.to + 1);
        };

        //----------------------------------------------------

        var setRange = function(records, page){

            var from = (page - 1) * pageSize;
            var to = (page * pageSize) - 1;

            if (from > 0 && from >= records.length) {
                from =  Math.floor((records.length -1) / pageSize) * pageSize;
                to = Math.min(from + pageSize - 1, records.length - 1);
            }

            return{
                from:from,
                to:to
            };
        };

        return{
            filter: filter
        };
    };

    return LocalStorageFilterer;
});


