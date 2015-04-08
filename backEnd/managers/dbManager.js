module.exports = function() {

    var mongoose = require('mongoose');

    var dbURI = process.env.MONGOHQ_URL || "mongodb://localhost:27017/mailbonedb"; //mongodb://nodejitsu:a9de1d32d544df0f900176e0ef1df08b@troup.mongohq.com:10015/nodejitsudb9726200492";

    var Models = {};

    //------------------------------------------------------------
    // connect
    //------------------------------------------------------------

    var connect = function(cb){

        mongoose.connect(dbURI);

        mongoose.connection.once('open', function callback () {
            mongoose.connection.collection("mails").drop();
            setMailSchema();
            cb(Models);
        });

        mongoose.connection.on('error',function (err) {
            console.error.bind(console, 'connection error:');
        });
    };

    //-----------------------------------------------------------

    var setMailSchema = function(){

        var MailSchema = new mongoose.Schema({
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
        Models.MailModel = mongoose.model('Mail', MailSchema);
    };


    return {
        connect:connect
    };
}();
