module.exports = function() {

    var socketManager = require('../../../managers/socketManager');

    var deleteItem = function (userName, data, MailModel) {

        MailModel.remove({id:data.id}, function (err) {
            if (err){
                socketManager.emit(userName, 'mail:delete', {"success":false});
            }else{
                socketManager.emit(userName, 'mail:delete', {"success":true});
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteItem:deleteItem
    }
}();

