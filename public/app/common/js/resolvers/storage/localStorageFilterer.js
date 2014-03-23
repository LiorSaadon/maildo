define(function (require) {
    "use strict";

    var LocalStorageFilterer = function (_orderBy) {

        var pageSize = 5;


        //=========================================================
        // filter
        //=========================================================


        var filter = function(records, filters, filteringMap){

            var metadata = {};

            records = filterByQuery(records, filters.query, filteringMap);
            records = filterByPage(records,filters.page, metadata);

            return{
                metadata:metadata,
                collection:records
            };
        };

        //-------------------------------------------------
        // filterByQuery
        //-------------------------------------------------

        var filterByQuery = function(records, query, filteringMap){

            var subQueries = query.split(' ');

            for(var i=0; i<subQueries.length; i++){

                if(subQueries[i].indexOf(':') > 0){
                    records = filterByReservedKey(records, subQueries[i], filteringMap);
                }else{
                    records = filterByFreeKey(records, subQueries[i], filteringMap);
                }
            }

            return records;
        };

        //----------------------------------------------

        var filterByReservedKey = function(records, subQuery, filteringMap){

             var qInfo = subQuery.split(':');

             var key = qInfo[0],value = qInfo[1];

             if(filteringMap.fields[key] === "tag"){

                 return _.reject(records, function (obj) {

                     if(_.isObject(obj[key])){
                         return !_.has(obj[key],value);
                     }
                     else if(_.isString(obj[key])){
                         return obj[key] === value;
                     }
                     return true;
                 });
             }else if(filteringMap.fields[key] === "data"){

                 return _.reject(records, function (obj) {

                     if(_.isString(obj[key])){
                         return obj[key].indexOf(value) === -1;
                     }
                     return true;
                 });
             }
        };

        //----------------------------------------------

        var filterByFreeKey = function(records, word, filteringMap){

            var t=  _.filter(records, function (obj){

                var res = 0;

                _.each(obj, function(val, key){

                    if(filteringMap.fields[key] === "data"){
                        res += (obj[key].indexOf(word) > -1) ? 1 : 0;
                    }
                });
                return res > 0;
            });

            return  t;
        };

        //-------------------------------------------------
        // filterByPage
        //-------------------------------------------------

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


