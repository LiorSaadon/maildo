module.exports = function() {

    var select = function (io, data, MailModel) {

        MailModel.find({}, function(error, mails) {
            io.sockets.emit('mails:read', {"success":true,"data":{"collection":mails,"metadata":{}}});
        });
    };

    //-----------------------------------------------------

    return{
        select:select
    }
}();

