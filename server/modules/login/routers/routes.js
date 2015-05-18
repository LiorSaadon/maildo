module.exports = function(app, passport) {

    var path = require('path');

    //-----------------------------------------------------
    // LOGIN
    //-----------------------------------------------------


    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: ""});
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
        res.render('signup.ejs', {message: "signup"});
    });

    //----------------------------------------------------

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/',
        failureRedirect : '/signup',
        failureFlash : true
    }));

    //
    ////-----------------------------------------------------
    //// INDEX
    ////-----------------------------------------------------
    //
    //app.get('*', isLoggedIn, function(req, res) {
    //    //http://stackoverflow.com/questions/21170253/cannot-use-basic-authentication-while-serving-static-files-using-express/21170931#21170931
    //    res.redirect('/');
    //    //res.sendFile('index.html', { root: path.join(__dirname, '../../../../client') });
    //});
    //
    ////-----------------------------------------------------
    //
    //
    //function isLoggedIn(req, res, next) {
    //
    //    console.log("444444");
    //    if (req.isAuthenticated()){
    //        return next();
    //    }
    //    res.redirect('/login');
    //}
};
