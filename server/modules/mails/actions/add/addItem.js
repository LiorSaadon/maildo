module.exports = function(app) {

    var _ = require("underscore");
    var shortId = require('shortid');

    var add = function (ioManager, socket, userName, data, MailModel) {

        setData(data,userName);

        var mail = new MailModel(data);

        mail.save(function (err) {
            if (err){
                ioManager.emit(socket, 'mail:create', {"success":false});
            }else{
                ioManager.emit(socket, 'mail:create', {"success":true,"data":mail}, userName);
            }
        });
    };

    //------------------------------------------------------------

    var setData = function(data,userName){

        data.id = "_" + shortId.generate();
        data.labels = {unread: true, unstarred: true, unimportant: true};
        data.from = userName + "@maildo.com";
        data.sentTime = (new Date()).getTime();
    };

    //-----------------------------------------------------

    return{
        add:add
    };
}();

