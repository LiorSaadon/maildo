module.exports = function(app, __dirname) {

    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: ""});
    });

    app.get('/signup', function (req, res) {
        res.render('signup.ejs', {message: "signup"});
    });
};
