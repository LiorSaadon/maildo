module.exports = function() {

    var buildQuery = function(data) {

        return {

            "labels.read": { $eq: false },
            "groups": {$in: ["inbox"]}
        }
    }

    //-----------------------------------------------------

    return{
        buildQuery:buildQuery
    }
}();


