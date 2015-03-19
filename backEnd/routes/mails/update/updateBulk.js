module.exports = function() {

    var async = require('async');
    var _ = require("underscore");

    var updateBulk = function (io, data, MailModel) {

        var idArr = data.map(function(item){
            return item.id;
        });

        MailModel.find({'id': { $in: idArr}}, function(err, mails){
            var calls = [];

            _merge(mails, data);

            mails.forEach(function(mail){
                calls.push(function(callback) {
                       mail.save(function (err) {
                        callback(null, mail);
                    });
                });
            });

            async.parallel(calls, function(err, result) {
                if (err){
                    io.sockets.emit('mails:update', {"success":false});
                }else{
                    console.log("great");
                    io.sockets.emit('mails:update', {"success":true});
                }
            });
        });
    };

    //---------------------------------------------------

    var _merge = function(main, sub) {

        _.each(sub, function(subObj) {
            var mainObj = _.find(main, function(mainObj) {
                return mainObj.id === subObj.id;
            });
            _doMerge(mainObj, subObj);
        });
    };

    //---------------------------------------------------

    function _doMerge(mainObj, subObj) {

        for (var key in subObj) {
            mainObj[key] = subObj[key];
        }
    };

    //---------------------------------------------------

    return{
        updateBulk:updateBulk
    }
}();

