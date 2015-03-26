module.exports = function() {

    var shortId = require('shortid');
    var socketManager = require('../../../managers/socketManager');

    var add = function (socket, userName, data, MailModel) {

        data.id = "_" + shortId.generate();

        var mail = new MailModel(data);

        mail.save(function (err) {
            if (err){
                socketManager.emit(socket, 'mail:create', {"success":false});
            }else{
                socketManager.emit(socket, 'mail:create', {"success":true,"data":mail}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        add:add
    }
}();

