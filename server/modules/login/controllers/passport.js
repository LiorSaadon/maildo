module.exports = function(db) {

    var passport      = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    var UserModel     = require('../models/userModel.js');

    var User = UserModel.create(db);

    //--------------------------------------------------------------
    // passport session setup
    //--------------------------------------------------------------

    passport.serializeUser(function (user, done) {
        console.log("bbbbbbbbbbbbbbbbbbbb");
        done(null, user.id);
    });


    passport.deserializeUser(function (id, done) {
        console.log("tttttttttttttttttttt");
        done(null, {id:"rambo1"});
        //User.findById(id, function (err, user) {
        //    done(err, user);
        //});
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
            process.nextTick(function () {
                return done(null, {id: "rambo"});
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
            console.log("2222222222");
            process.nextTick(function () {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            });
        })
    );


    return{
        passport:passport
    }
};