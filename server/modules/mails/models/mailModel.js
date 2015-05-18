module.exports = function() {

    var create = function(db){

        var MailSchema = new db.Schema({
            "id": String,
            "userId":String,
            "from": String,
            "to": String,
            "cc": String,
            "bcc":String,
            "subject": String,
            "sentTime": String,
            "body": String,
            "relatedBody": String,
            "labels": {
                "read": Boolean,
                "starred": Boolean,
                "important": Boolean
            },
            "groups": []
        });
        return db.model('Mail', MailSchema);
    };

    return {
        create:create
    };
}();
