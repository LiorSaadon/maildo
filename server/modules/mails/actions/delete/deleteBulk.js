module.exports = function() {

    var async = require('async');
    var socketManager = require('../../../../common/socketManager');

    var deleteBulk = function (io, socket, userName, data, MailModel) {

        var calls = [];

        data.forEach(function(itemId){
            calls.push(function(callback) {
                MailModel.remove({id:itemId}, function (err) {
                    if (err){
                        return callback(err);
                    }
                    callback(null, itemId);
                });
            });
        });

        async.parallel(calls, function(err, result) {
            if (err){
                socketManager.emit(io, socket, 'mails:delete', {"success":false});
            }else{
                socketManager.emit(io, socket, 'mails:delete', {"success":true}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteBulk:deleteBulk
    }
}();


