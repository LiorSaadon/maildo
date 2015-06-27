module.exports = function() {

    var path         = require('path');
    var session      = require('express-session');
    var flash        = require('connect-flash');
    var cookieParser = require('cookie-parser');
    var bodyParser   = require('body-parser');

    var passport;

    //------------------------------------------------------------
    // start
    //------------------------------------------------------------

    var start = function(db, app){

        createPassport(db, app);
        extendApp(app);
        setRouters(app);
    };

    //-------------------------------------------------------------

    var createPassport = function(db, app){
        passport = require('./controllers/passport')(db, app).passport;
    };

    //-------------------------------------------------------------

    var extendApp = function(app){

        app.set('views', path.join(__dirname, '/views'));

        app.use(cookieParser());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        app.use(session({ secret: 'maildo_project', resave:true, saveUninitialized:true}));
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(flash());
    };

    //-------------------------------------------------------------

    var setRouters = function(app){
        require('./routers/routes.js')(app, passport);
    };

    return{
        start:start
    };
}();

