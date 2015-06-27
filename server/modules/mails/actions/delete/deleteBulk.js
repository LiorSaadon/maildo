module.exports = function() {

    var async = require('async');

    var deleteBulk = function (ioManager, socket, userName, data, MailModel) {

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
                ioManager.emit(socket, 'mails:delete', {"success":false});
            }else{
                ioManager.emit(socket, 'mails:delete', {"success":true}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteBulk:deleteBulk
    }
}();


