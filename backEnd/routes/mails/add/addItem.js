module.exports = function() {

    var shortId = require('shortid');

    var add = function (io, data, MailModel) {

        var mail = new MailModel({
            "id": "_" + shortId.generate(),
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "patricia.white@mailbone.com;michael.martin@mailbone.com;",
            "cc": "williams@mailbone.com",
            "bcc": "",
            "subject": "Things You Can Do With JavaScript",
            "sentTime": "2014-04-12 15:06:51",
            "body": "later",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "sent": true
            }
        });

        mail.save(function (err) {
            if (err){
                io.sockets.emit('addItem:create', {"success":false});
            }else{
                io.sockets.emit('addItem:create', {"success":true,"data":mail});
            }
        });
    };

    //-----------------------------------------------------

    return{
        add:add
    }
}();

