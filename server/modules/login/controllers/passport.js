module.exports = function(db, app) {

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

            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {

            User.findOne({ 'username' :  username }, function(err, user) {

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

            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        },
        function (req, username, password, done) {

            User.findOne({ 'username' :  username }, function(err, user) {

                if (err){
                    return done(err);
                }
                if (user) {
                    return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                } else {

                    var newUser = new User();

                    newUser.username = username;
                    newUser.password = newUser.generateHash(password);

                    newUser.save(function(err) {
                        if (err){
                            throw err;
                        }
                        app.get("emitter").emit("new-user",newUser);
                        return done(null, newUser);
                    });
                }
            });
        })
    );

    return{
        passport:passport
    };
};