module.exports = function() {

    var async = require('async');
    var _ = require("underscore");
    var socketManager = require('../../../managers/socketManager');

    var updateItem = function (socket, userName, data, MailModel) {

        var newVal = {
            "from": data.from,
            "to": data.to,
            "cc": data.cc,
            "bcc":data.bcc,
            "subject": data.subject,
            "sentTime": data.sentTime,
            "body": data.body,
            "relatedBody": data.relatedBody
        }

        console.log(data);

        MailModel.findByIdAndUpdate(data._id, {$set: newVal}, function (err, mail) {
            if (err){
                console.log(err);
                socketManager.emit(socket, 'mail:update', {"success":false});
            }else{
                console.log("--------------999999999-" );
                console.log(mail)
                socketManager.emit(socket, 'mail:update', {"success":true,"data":mail}, userName);
            }
        });
    }

    //---------------------------------------------------

    return{
        updateItem:updateItem
    }
}();

