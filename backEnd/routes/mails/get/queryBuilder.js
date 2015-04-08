module.exports = function () {

    var buildQuery = function (data) {

        var query = {}, subQueries = adjustQueryInput(data.query).split(' ');

        for (var i = 0; i < subQueries.length; i++) {
            updateQueryObject(query, subQueries[i]);
        }
        return query;
    };

    //------------------------------------------------------

    var adjustQueryInput = function (query) {

        return query.replace(/\s\:/g, ':').replace(/:\s/g, ':').replace("label:", "labels:").replace("in:", "groups:").trim();  // "  x : y label : inbox  " ==> "x:y labels:inbox"
    };

    //-----------------------------------------------------

    var updateQueryObject = function (query, subQuery) {

        var arr = subQuery.split(':');

        if (arr.length == 2) {
            addHardKey(arr[0].toLowerCase(), arr[1], query);
        } else {
            addOptionalKey(arr[0], query)
        }
    };

    //------------------------------------------------------

    var addHardKey = function (key, value, query) {

        if (key === "groups") {
            query[key] = {$in: [value]}
        }
        if (key.indexOf("labels.") == 0) {
            query[key] = {$eq: (value === "true")}
        }
        if (key === "from") {
            query[key] = {$regex: ".*" + value + ".*"}
        }
        if (key === "to") {
            query[key] = {$regex: ".*" + value + ".*"}
        }
    };

    //------------------------------------------------------

    var addOptionalKey = function (val, query) {

        query['$or'] = query['$or'] || [];
        query['$or'].push({body: {$regex: ".*" + val + ".*"}});
        query['$or'].push({subject: {$regex: ".*" + val + ".*"}});
    };

    //------------------------------------------------------

    return {
        buildQuery: buildQuery
    }
}();

