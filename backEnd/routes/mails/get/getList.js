module.exports = function() {

    var socketManager = require('../../../managers/socketManager');

    var select = function (userName, data, MailModel) {

        MailModel.find({}, function(error, mails) {
            socketManager.emit(userName, 'mails:read', {"success":true,"data":{"collection":mails,"metadata":{}}});
        });
    };

    //-----------------------------------------------------

    return{
        select:select
    }
}();
