// routes/users.js

var express = require('express');
var router = express.Router();
var models = require('../models');
var User = models.User;
var Post = models.Post;
var util = require('../util');

// Index // 1
router.get('/', function(req, res){
  User.findAll({}, {order:[['username', 'ASC']]})
    .then(users => {
        res.render('users/index', {users:users});
    })
    .catch(err => {
        if(err) return res.json(err);
    });
});

// New
router.get('/new', function(req, res){
    var user = req.flash('user')[0] || {};
    var errors = req.flash('errors')[0] || {};
    res.render('users/new', {user:user, errors:errors});
});

// create
router.post('/', function(req, res){
    User.create(req.body)
        .then(user => {
            res.redirect('/users');
        })
        .catch(err => {
            console.log('err: ' + err);
            req.flash('user', req.body);
            req.flash('errors', util.parseError(err));
            return res.redirect('/users/new');
        });
});

// show
router.get('/:username', util.isLoggedin, checkPermission, function(req, res){
    console.log('username: ' + JSON.stringify(req.params.username));
    User.findOne({where:{username:req.params.username}})
        .then(user => {
            console.log('user: ' + JSON.stringify(user));
            res.render('users/show', {user:user});
        })
        .catch(err => {
            console.log('errors: ' + JSON.stringify(err));
            return res.json(err);
        });
});

// edit
router.get('/:username/edit', util.isLoggedin, function(req, res){
    var user = req.flash('user')[0];
    var errors = req.flash('errors')[0] || {};
    if (!user) {
        User.findOne({username:req.params.username})
        .then(user => {
            res.render('users/edit', {username:req.params.username, user:user, errors:errors});
        })
        .catch(err => {
            return res.json(err);
        });
    }
    else {
        res.redirect('users/edit', {username:req.params.username, user:user, errors:errors})
    }
});

// update // 2
router.put('/:username', util.isLoggedin, checkPermission, function(req, res, next){
    User.findOne({username:req.params.username}, {
        attributes: ['username', 'password', 'name', 'email']
    })
        .then(user => {
            // update user object
            user.originalPassword = user.password;
            user.password = req.body.newPassword? req.body.newPassword : user.password; // 2-3
            for(var p in req.body){ // 2-4
                user[p] = req.body[p];
            }

            // save updated user
            user.save()
                .then(user => {
                    res.redirect('/users/' + user.username);
                })
                .catch(err => { 
                    req.flash('errors', util.parseError(err));
                    return res.redirect('/users/' + req.params.username + '/edit');
                });
        })
        .catch(err => {
            if(err) return res.json(err);
        });
});

// destroy
router.delete('/:username', util.isLoggedin, checkPermission, function(req, res){
    User.destroy({where:{username:req.params.username}})
        .then(() => { res.redirect('/users'); })
        .catch(err => { if(err) return res.json(err); });
});

function checkPermission(req, res, next) {
    console.log('checkPermission: ' + req.params.username);
    User.findOne({where:{username:req.params.username}})
        .then(user => {
            if (user.id != req.user.id) {
                util.noPermission(req, res);
            }
            next();
        })
        .catch(err => {
            res.json(err);
        });
}

module.exports = router;
