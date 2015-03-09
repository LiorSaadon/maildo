var http = require('http');
var path = require('path');
var express = require('express');
var mails = require('./backEnd/routes/mails/mails');
var dbManager = require('./backEnd/managers/dbManager');

var app = express();

dbManager.connect(function(Models){

    app.configure('all', function(){
        app.set('port', process.env.PORT || 3000);
        app.use(express.logger('dev'));
        app.use(express.json());
        app.use(express.urlencoded());
        app.use(express.methodOverride());
        app.use(express.static(path.join(__dirname, 'frontEnd')));
    });

    mails.setModel(Models.MailModel);
    app.get('/mails', mails.getList);
    app.post('/addItem', mails.addItem);

    http.createServer(app).listen(app.get('port'), function () {
        console.log("Express server listening on port " + app.get('port'));
    });
});


