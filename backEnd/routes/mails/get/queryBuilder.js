module.exports = function () {

    var buildQuery = function (data) {

        var query = {}, subQueries = adjustQueryInput(data.query).split(' ');

        for (var i = 0; i < subQueries.length; i++) {
            addSetQuery(query, subQueries[i]);
        }
        return query;
    };

    //------------------------------------------------------

    var adjustQueryInput = function (query) {

        query = query.replace(/\s\:/g, ':').replace(/:\s/g, ':').replace("label:", "labels:").trim();  // "  x : y label : inbox  " ==> "x:y labels:inbox"

        if (query.indexOf("groups:") === -1) {
            query += ' ' + "groups:inbox";
        }
        return query;
    };

    //-----------------------------------------------------

    var addSetQuery = function (query, subQuery) {

        var arr = subQuery.split(':');

        if (arr.length == 2) {
            addReservedKey(arr[0].toLowerCase(), arr[1], query);
        } else {
            addKey(arr, query)
        }
    };

    //------------------------------------------------------

    var addReservedKey = function (key, value, query) {

        if (key === "groups") {
            query[key] = {$in: [value]}
        }
        if (key.indexOf("labels.") == 0) {
            query[key] = {$eq: (value === "true")}
            console.log(query);
        }
    };

    //------------------------------------------------------

    var addKey = function (val, query) {

        query['$or'] = query['$or'] || [];
        query['$or'].push({bcc: {$regex: ".*" + val + ".*"}});
        query['$or'].push({body: {$regex: ".*" + val + ".*"}});
        query['$or'].push({subject: {$regex: ".*" + val + ".*"}});
    };

    return {
        buildQuery: buildQuery
    }
}();


