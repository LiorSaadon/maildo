module.exports = function() {

    var async = require('async');
    var _ = require("underscore");
    var socketManager = require('../../../../common/socketManager');

    var updateBulk = function (ioManager, socket, userName, data, MailModel) {

        var calls = [];

        var idArr = data.map(function(item){
            return item.id;
        });

        _.each(idArr, function (id) {
            calls.push(function (callback) {
                MailModel.update({id: id}, {$set: buildQuery(data, id)}, function (err) {
                    callback(null);
                });
            });
        });

        async.parallel(calls, function (err, result) {
            if (err) {
                ioManager.emit(socket, 'mails:update', {"success": false});
            } else {
                ioManager.emit(socket, 'mails:update', {"success": true}, userName);
            }
        });
    };

    //--------------------------------------------------

    var buildQuery = function(data, id){

        var result = {};

        var newDataObj = _.find(data, function(model) {
            return model.id == id;
        });

        for (var key in newDataObj) {
            if(key !== "id"){
                result[key] = newDataObj[key];
            }
        }
        return result;
    };

    //---------------------------------------------------

    return{
        updateBulk:updateBulk
    }
}();

