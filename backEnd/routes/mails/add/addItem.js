module.exports = function() {

    var add = function (req, res, MailModel) {

        var mail = new MailModel({
            "id": "_" + Math.floor((Math.random() * 10) + 1),
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

        console.log("before add...");
        mail.save(function (err) {
            if (err){
                console.log('save failed..');
            }else{
                console.dir(mail);
                res.send(mail);
            }
        });
    };

    //-----------------------------------------------------

    return{
        add:add
    }
}();

