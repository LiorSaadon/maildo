module.exports = function() {

    var async = require('async');

    var deleteBulk = function (io, data, MailModel) {

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
                io.sockets.emit('mails:delete', {"success":false});
            }else{
                io.sockets.emit('mails:delete', {"success":true});
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteBulk:deleteBulk
    }
}();

