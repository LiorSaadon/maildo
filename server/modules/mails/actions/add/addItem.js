module.exports = function() {

    var _ = require("underscore");
    var shortId = require('shortid');
    var socketManager = require('../../../../common/socketManager');

    var add = function (io, socket, userName, data, MailModel) {

        setData(data,userName);

        var mail = new MailModel(data);

        mail.save(function (err) {
            if (err){
                socketManager.emit(io, socket, 'mail:create', {"success":false});
            }else{
                socketManager.emit(io, socket, 'mail:create', {"success":true,"data":mail}, userName);
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
    }
}();

