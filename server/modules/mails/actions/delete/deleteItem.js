module.exports = function() {

    var socketManager = require('../../../../common/socketManager');

    var deleteItem = function (io, socket, userName, data, MailModel) {

        MailModel.remove({id:data.id}, function (err) {
            if (err){
                socketManager.emit(io, socket, 'mail:delete', {"success":false});
            }else{
                socketManager.emit(io, socket, 'mail:delete', {"success":true}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteItem:deleteItem
    }
}();

