module.exports = function() {

    var deleteItem = function (io, data, MailModel) {

        MailModel.remove({id:data.id}, function (err) {
            if (err){
                io.sockets.emit('mail:delete', {"success":false});
            }else{
                io.sockets.emit('mail:delete', {"success":true});
            }
        });
    };

    //-----------------------------------------------------

    return{
        deleteItem:deleteItem
    }
}();

