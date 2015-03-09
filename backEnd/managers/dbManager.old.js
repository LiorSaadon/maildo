module.exports = function() {

    var mongoose = require('mongoose');

    var dbURI = process.env.MONGOHQ_URL || "mongodb://localhost:27017/mailbonedb"; //mongodb://nodejitsu:a9de1d32d544df0f900176e0ef1df08b@troup.mongohq.com:10015/nodejitsudb9726200492";

    var DB = {};

    //------------------------------------------------------------
    // connect
    //------------------------------------------------------------

    var connect = function(cb){

        mongoose.connect(dbURI);

        mongoose.connection.once('open', function callback () {
            setMailSchema();
            cb(DB);
        });

        mongoose.connection.on('error',function (err) {
            console.error.bind(console, 'connection error:');
        });
    };

    //-----------------------------------------------------------

    var setMailSchema = function(){

        var MailSchema = new mongoose.Schema({
            id: String,
            userId:String,
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
            "groups": {
                "sent": Boolean
            }
        });
        DB.mailMaodel = mongoose.model('Mail', MailSchema);
    };

    //------------------------------------------------------------
    // populateDB
    //------------------------------------------------------------

    var populateDB = function(cb){

        var mails = [{
            "id": "_906",
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
        }, {
            "id": "_905",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "anna.james@mailbone.com;julia.ward@mailbone.com;",
            "cc": "",
            "bcc": "",
            "subject": "Things You Can Do With JavaScript",
            "sentTime": "2014-04-12 18:06:51",
            "body": "later",
            "relatedBody": "mail2",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "sent": true
            }
        }, {
            "id": "_904",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "anna.james@mailbone.com;",
            "cc": "",
            "bcc": "",
            "subject": "Things You Can Do With JavaScript",
            "sentTime": "2014-04-12 17:06:51",
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
        }, {
            "id": "_903",
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
        }, {
            "id": "_902",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "anna.james@mailbone.com;julia.ward@mailbone.com;",
            "cc": "",
            "bcc": "",
            "subject": "Things You Can Do With JavaScript",
            "sentTime": "2014-04-12 18:06:51",
            "body": "later",
            "relatedBody": "mail2",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "sent": true
            }
        }, {
            "id": "_901",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "anna.james@mailbone.com;",
            "cc": "",
            "bcc": "",
            "subject": "Things You Can Do With JavaScript",
            "sentTime": "2014-04-12 17:06:51",
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
        }, {
            "id": "_900",
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
        }, {
            "id": "_802",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "patricia.white@mailbone.com;alan.rogers@mailbone.com;dennis.king@mailbone.com;",
            "cc": "anna.james@mailbone.com;demo@mailbone.com;",
            "bcc": "",
            "subject": "Draft 453",
            "sentTime": "2014-04-12 18:06:51",
            "body": "this is a draft (1)",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "unstarred": true,
                "unimportant": true
            },
            "groups": {
                "draft": true
            }
        }, {
            "id": "_801",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "anna.james@mailbone.com;",
            "cc": "demo@mailbone.com;patricia.white@mailbone.com;",
            "bcc": "",
            "subject": "Draft 111",
            "sentTime": "2014-04-12 17:06:51",
            "body": "this is a draft (2)",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "unstarred": true,
                "unimportant": true
            },
            "groups": {
                "draft": true
            }
        }, {
            "id": "_800",
            userId:"1",
            "from": "demo@mailbone.com",
            "to": "patricia.white@mailbone.com;michael.martin@mailbone.com;",
            "cc": "patricia.white@mailbone.com;dennis.king@mailbone.com;",
            "bcc": "",
            "subject": "Draft 123",
            "sentTime": "2014-04-12 15:06:51",
            "body": "this is a draft (3)",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "unstarred": true,
                "unimportant": true
            },
            "groups": {
                "draft": true
            }
        }, {
            "id": "_703",
            userId:"1",
            "from": "billy.young@mailbone.com",
            "to": "demo@mailbone.com;",
            "cc": "margaret.hughes@mailbone.com;",
            "bcc": "",
            "subject": "Why Should I Use Backbone.Marionette?",
            "sentTime": "2014-04-08 17:06:51",
            "body": "later",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "inbox": true
            }
        }, {
            "id": "_702",
            userId:"1",
            "from": "nichole.hampton@mailbone.com",
            "to": "demo@mailbone.com;",
            "cc": "eugene.cooper@mailbone.com;",
            "bcc": "billy.young@mailbone.com",
            "subject": "What is underscore?",
            "sentTime": "2014-04-07 13:06:51",
            "body": "later",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "inbox": true
            }
        }, {
            "id": "_701",
            userId:"1",
            "from": "eugene.cooper@mailbone.com",
            "to": "demo@mailbone.com;",
            "cc": "nichole.hampton@mailbone.com;",
            "bcc": "",
            "subject": "How to use Mustache.js",
            "sentTime": "2014-04-06 14:06:51",
            "body": "later",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "inbox": true
            }
        }, {
            "id": "_700",
            userId:"1",
            "from": "sherri.lyons@mailbone.com",
            "to": "demo@mailbone.com;",
            "cc": "eugene.cooper@mailbone.com;",
            "bcc": "",
            "subject": "How to Test your JavaScript Code",
            "sentTime": "2014-04-05 14:06:51",
            "body": "later",
            "relatedBody": "mail1",
            "labels": {
                "read": true,
                "starred": true,
                "important": true
            },
            "groups": {
                "inbox": true
            }
        }];

        mongoose.connection.collection("mails").drop();

        mongoose.connection.collection('mails', function (err, collection) {
            collection.insert(mails, {safe: true}, function (err, result) {
                cb();
            });
        });
    };

    return {
        getMailModel:function(){return Mail;},
        connect:connect
    };
}();
