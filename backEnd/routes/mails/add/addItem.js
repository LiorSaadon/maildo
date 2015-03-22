module.exports = function() {

    var shortId = require('shortid');
    var socketManager = require('../../../managers/socketManager');

    var add = function (userName, data, MailModel) {

        data.id = "_" + shortId.generate();

        var mail = new MailModel(data);

        mail.save(function (err) {
            if (err){
                socketManager.emit(userName, 'mail:create', {"success":false});
            }else{
                socketManager.emit(userName, 'mail:create', {"success":true,"data":mail});
            }
        });
    };

    //-----------------------------------------------------

    return{
        add:add
    }
}();

