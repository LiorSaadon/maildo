module.exports = function() {

    var mongoose = require('mongoose');

    var Models = {};

    //------------------------------------------------------------
    // connect
    //------------------------------------------------------------

    var connect = function(cb){

        var connection_string = '127.0.0.1:27017/mailbonedb';

        if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
            connection_string =
            process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
            process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
            process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
            process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
            process.env.OPENSHIFT_APP_NAME;
        }
        mongoose.connect(connection_string);

        mongoose.connection.once('open', function callback () {
            console.log("Mongodb connection was successfully established");
            mongoose.connection.collection("mails").drop();
            setMailSchema();
            cb(Models);
        });

        mongoose.connection.on('error',function (err) {
            console.log("Error establishing database connection");
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
