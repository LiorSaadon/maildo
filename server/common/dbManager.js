module.exports = function() {

    var mongoose = require('mongoose');

    //---------------------------------------------------------
    // connect
    //---------------------------------------------------------

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
            mongoose.connection.collection("mails").drop();
            mongoose.connection.collection("users").drop();
            mongoose.connection.collection("settings").drop();
            console.log("Mongodb connection was successfully established");

            cb(mongoose);
        });

        mongoose.connection.on('error',function (err) {
            console.log("Error establishing database connection");
        });
    };

    //---------------------------------------------------------

    return {
        connect:connect
    };
}();
