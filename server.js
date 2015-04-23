//shaul test  SXSXSXS

var PORT = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT  || 9595;
var IPADDRESS = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

var mongoose = require('mongoose');
var express = require('express');
var argv = require('optimist').argv;

var server;
var io;
var app;


var Models = {};

app = express();
app.use(express.static(__dirname + "/frontEnd"));


server = require('http').createServer(app);
io = require('socket.io').listen(server);
server.listen(PORT, IPADDRESS);

//--------------------------------------------------------------
// monogoDB
//--------------------------------------------------------------


var connection_string = '127.0.0.1:27017/mailbonedb';
// if OPENSHIFT env variables are present, use the available connection info:
if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
    connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
    process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
    process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
    process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
    process.env.OPENSHIFT_APP_NAME;
}

mongoose.connect(connection_string);

mongoose.connection.once('open', function callback () {
    console.log("------------------------- :: Mongodb connection was successfully established");
    mongoose.connection.collection("mails").drop();
    console.log("------------------------- :: drop successfully established");
    kuku = "gooooooooooooooooood!!!!"
});

mongoose.connection.on('error',function (err) {
    kuku = "error!!!!"
    console.log("Error establishing database connection");
});


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


//----------------------------------------------------------------


io.sockets.on('connection', function (socket) {

    socket.on('chat', function (msg) {

        add(msg);
    });

    var add =  function(msg) {

        msg = msg || "empty ";

        var data = {
            id: "_" + new Date().getTime(),
            "userId": "1",
            "from": "demo@mailbone.com",
            "to": "patricia.white@mailbone.com;michael.martin@mailbone.com;",
            "cc": "williams@mailbone.com",
            "bcc": "",
            "subject": "subject2",
            "sentTime": "2014-04-12 15:06:51",
            "body": "body2",
            "relatedBody": "mail1",
            "labels": {
                "read": false,
                "starred": true,
                "important": true
            },
            "groups": ["inbox"]
        }

        var mail = new Models.MailModel(data);

        mail.save(function (err) {
            if (err) {
                console.log("kuku:error");
                socket.emit('chat', msg + " :: error!!!!!");
            } else {
                console.log("kuku: great");
                socket.emit('chat', msg + " :: great!!!");
            }
        });
    }
});
