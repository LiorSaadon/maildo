module.exports = function() {

    var async = require('async');
    var _ = require("underscore");
    var socketManager = require('../../../managers/socketManager');


    var updateBulk = function (userName, data, MailModel) {

        var idArr = data.map(function(item){
            return item.id;
        });

        MailModel.find({'id': { $in: idArr}}, function(err, mails){
            var calls = [];

            _override(mails, data);

            mails.forEach(function(mail){
                calls.push(function(callback) {
                    mail.save(function (err) {
                        callback(null, mail);
                    });
                });
            });

            async.parallel(calls, function(err, result) {
                if (err){
                    socketManager.emit(userName, 'mails:update', {"success":false});
                }else{
                    socketManager.emit(userName, 'mails:update', {"success":true});
                }
            });
        });
    };

    //---------------------------------------------------

    var _override = function(main, newData) {

        _.each(newData, function(newDataObj) {
            var mainObj = _.find(main, function(mainObj) {
                return mainObj.id === newDataObj.id;
            });
            _doOverride(mainObj, newDataObj);
        });
    };

    //---------------------------------------------------

    var _doOverride = function(mainObj, newDataObj) {

        if(_.isObject(mainObj)){
            for (var key in newDataObj) {
                mainObj[key] = newDataObj[key];
            }
        }
    };

    //---------------------------------------------------

    return{
        updateBulk:updateBulk
    }
}();

