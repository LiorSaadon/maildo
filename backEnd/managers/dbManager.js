module.exports = function() {

    var mongoose = require('mongoose');
    var envConfig = require('../config/env-conf.json');

    var Models = {};

    //------------------------------------------------------------
    // connect
    //------------------------------------------------------------

    var connect = function(cb){

        mongoose.connect(envConfig.DB_URL);

        mongoose.connection.once('open', function callback () {
            console.log("Mongodb connection was successfully established");
            mongoose.connection.collection("mails").drop();
            setMailSchema();
            cb(Models);
        });

        mongoose.connection.on('error',function (err) {
            console.log("Error establishing database connection");
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
