module.exports = function() {

    var _ = require("underscore");
    var socketManager = require('../../../../common/socketManager');

    var updateItem = function (io, socket, userName, data, MailModel) {

        setData(data,userName);

        var newVal = {
            "from": data.from,
            "to": data.to,
            "cc": data.cc,
            "bcc":data.bcc,
            "subject": data.subject,
            "sentTime": data.sentTime,
            "body": data.body,
            "groups":data.groups,
            "labels":data.labels
        };

        MailModel.findByIdAndUpdate(data._id, {$set: newVal}, function (err, mail) {
            if (err){
                socketManager.emit(io, socket, 'mail:update', {"success":false});
            }else{
                socketManager.emit(io, socket, 'mail:update', {"success":true,"data":mail}, userName);
            }
        });
    };

    //------------------------------------------------------------

    var setData = function(data,userName){

        if(_.isEmpty(data.groups)){
            data.groups.push("sent");

            if((data.to + data.cc + data.bcc).indexOf(userName) !== -1){
                data.groups.push("inbox");
            }
        }
    };

    //------------------------------------------------------------

    return{
        updateItem:updateItem
    }
}();

