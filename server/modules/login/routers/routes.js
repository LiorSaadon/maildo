module.exports = function(app, passport) {

    var path = require('path');

    //-----------------------------------------------------
    // LOGIN
    //-----------------------------------------------------


    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMessage')});
    });

    //----------------------------------------------------

    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/',
        failureRedirect : '/login',
        failureFlash : true
    }));


    //-----------------------------------------------------
    // SIGNUP
    //-----------------------------------------------------


    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: req.flash('signupMessage')});
    });

    //----------------------------------------------------

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : true
    }));


    //-----------------------------------------------------
    // INDEX
    //-----------------------------------------------------

    app.get('/', isLoggedIn, function(req, res) {
        res.sendFile('index1.html', { root: path.join(__dirname, '../../../../client') });
    });

    //-----------------------------------------------------

    function isLoggedIn(req, res, next) {

        if (req.isAuthenticated()){
            return next();
        }
        res.redirect('/login');
    }
};
