module.exports = function() {

    var shortId = require('shortid');

    var add = function (io, data, MailModel) {

        data.id = "_" + shortId.generate();

        var mail = new MailModel(data);

        mail.save(function (err) {
            if (err){
                io.sockets.emit('mail:create', {"success":false});
            }else{
                io.sockets.emit('mail:create', {"success":true,"data":mail});
            }
        });
    };

    //-----------------------------------------------------

    return{
        add:add
    }
}();

