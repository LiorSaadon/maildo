module.exports = function() {

    var deleteItem = function (ioManager, socket, userName, data, MailModel) {

        MailModel.remove({id:data.id}, function (err) {
            if (err){
                ioManager.emit(socket, 'mail:delete', {"success":false});
            }else{
                ioManager.emit(socket, 'mail:delete', {"success":true}, userName);
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteItem:deleteItem
    }
}();

