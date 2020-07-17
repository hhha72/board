// config/passport.js

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var models = require('../models');
var User = models.User;

// serialize & deserialize User
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser((id, done) => {
    User.findOne({where:{id:id}})
        .then((user) => {
            done(null, user);
        })
        .catch((err) => {
            done(err);
        });
});

// local strategy
passport.use('local-login', new LocalStrategy({
    usernameField : 'username', 
    passwordField : 'password', 
    passReqToCallback : true
}, (req, username, password, done) => {
    User.findOne(
        {where:{username:username}}, 
        {attributes: ['username', 'password', 'name', 'email']}
        )
        .then((user) => {
            console.log('LocalStrategy user: ' + JSON.stringify(user));
            if (user && user.authenticate(password)) {
                return done(null, user);
            }
            else {
                req.flash('username', username);
                req.flash('errors', {login:'The username or password is incorrect.'});
                return done(null, false);
            }
        })
        .catch((err) => {
            return done(err);
        });
}));

module.exports = passport;
