
    var path           = require('path');
    var express        = require('express');
    var favicon        = require('serve-favicon');
    var morgan         = require('morgan');
    var dbManager      = require('./server/common/dbManager');
    var socketReseller = require('./server/setup/socketReseller');
    var login          = require('./server/modules/login/login');
    var mails          = require('./server/modules/mails/mails');
    var tasks          = require('./server/modules/tasks/tasks');
    var settings       = require('./server/modules/settings/settings');

    var port           = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8000;
    var address        = process.env.OPENSHIFT_INTERNAL_IP || process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';


    //-----------------------------------------------------
    // create app
    //-----------------------------------------------------

    var app = express();

    app.use(morgan('dev'));
    app.set('view engine', 'ejs');
    app.use(express.static(path.join(__dirname, 'client')));
    app.use(favicon(__dirname + '/client/app/common/ui/img/favicon.ico'));



    //-----------------------------------------------------
    // create server
    //-----------------------------------------------------

    var server = require('http').createServer(app);
    var io     = require('socket.io').listen(server);

    server.listen(port, address);
    console.log("server launched successfully on port: " + port);


    //-----------------------------------------------------
    // launch database modules and socket
    //-----------------------------------------------------

    dbManager.connect(function(db){

        mails.start(db);
        tasks.start(db);
        login.start(db,app);
        settings.start(db,app);

        io.sockets.on('connection', function (socket) {
            socketReseller.resell(io, socket, [mails, tasks]);
        });
    });

