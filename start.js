
    var path           = require('path');
    var express        = require('express');
    var favicon        = require('serve-favicon');
    var morgan         = require('morgan');
    var EventEmitter   = require('events').EventEmitter;
    var dbManager      = require('./server/common/dbManager');
    var login          = require('./server/modules/login/login');
    var mails          = require('./server/modules/mails/mails');
    var tasks          = require('./server/modules/tasks/tasks');
    var settings       = require('./server/modules/settings/settings');
    var socketManager  = require('./server/common/socketManager');

    var port           = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8000;
    var address        = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


    //-----------------------------------------------------
    // create app
    //-----------------------------------------------------

    var app = express();

    app.use(morgan('dev'));
    app.set('view engine', 'ejs');
    app.set('emitter',new EventEmitter());
    app.use(express.static(path.join(__dirname, 'client')));
    app.use(favicon(__dirname + '/client/dist/img/favicon.ico'));


    //-----------------------------------------------------
    // create server
    //-----------------------------------------------------

    var server = require('http').createServer(app);

    server.listen(port, address);
    console.log("server launched successfully on port: " + port);


    //-----------------------------------------------------
    // launch database, socketManager and modules
    //-----------------------------------------------------

    dbManager.connect(function(db){
        socketManager.set(server, [mails, tasks], function(){
            mails.start(db,app);
            tasks.start(db,app);
            login.start(db,app);
            settings.start(db,app);
        });
    });

