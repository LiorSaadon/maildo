module.exports = function() {

    var socketManager = require('../../../managers/socketManager');

    var select = function (socket, data, MailModel) {

        MailModel.find({}, function(error, mails) {
            socketManager.emit(socket, 'mails:read', {"success":true,"data":{"collection":mails,"metadata":{}}});
        });
    };

    //-----------------------------------------------------

    return{
        select:select
    }
}();
