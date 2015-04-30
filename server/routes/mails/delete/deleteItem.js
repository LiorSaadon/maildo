module.exports = function() {

    var socketManager = require('../../../managers/socketManager');

    var deleteItem = function (socket, userName, data, MailModel) {

        MailModel.remove({id:data.id}, function (err) {
            if (err){
                socketManager.emit(socket, 'mail:delete', {"success":false});
            }else{
                socketManager.emit(socket, 'mail:delete', {"success":true}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteItem:deleteItem
    }
}();

