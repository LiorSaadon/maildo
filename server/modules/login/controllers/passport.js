module.exports = function(db) {

    var passport      = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    var UserModel     = require('../models/userModel.js');

    var User = UserModel.create(db);

    //--------------------------------------------------------------
    // passport session setup
    //--------------------------------------------------------------

    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });


    passport.deserializeUser(function (id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });


    //--------------------------------------------------------------
    // local-login
    //--------------------------------------------------------------

    passport.use('local-login', new LocalStrategy({

            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {

            User.findOne({ 'local.email' :  email }, function(err, user) {

                if (err){
                    return done(err);
                }
                if (!user){
                    return done(null, false, req.flash('loginMessage', 'No user found.'));
                }
                if (!user.validPassword(password)){
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.'));
                }
                return done(null, user);
            });
        })
    );

    //--------------------------------------------------------------
    // local-signup
    //--------------------------------------------------------------

    passport.use('local-signup', new LocalStrategy({

            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, email, password, done) {

            User.findOne({ 'local.email' :  email }, function(err, user) {

                if (err){
                    return done(err);
                }
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                } else {

                    var newUser = new User();

                    newUser.email    = email;
                    newUser.password = newUser.generateHash(password);

                    newUser.save(function(err) {
                        if (err)
                            throw err;
                        return done(null, newUser);
                    });
                }
            });
        })
    );

    return{
        passport:passport
    }
};