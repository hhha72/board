// routes/comment.js
var express = require('express');
var router = express.Router();
var models = require('../models');
var Post = models.Post;
var Comment = models.Comment;
var util = require('../util');

// create
router.post('/', util.isLoggedin, checkPostId, (req, res) => {
    var post = res.locals.post;

    req.body.UserId = req.user.id;
    req.body.PostId = post.id;

    console.log('parentComment:' + req.body.parentComment);

    Comment.create(req.body)
        .then(comment => {
            console.log('comment: ' + JSON.stringify(comment));
            return res.redirect('/posts/' + post.id + res.locals.getPostQueryString());
        })
        .catch(err => {
            req.flash('commentForm', { id:null, form:req.body });
            req.flash('commentError', {id: null, parentComment:req.body.parentComment, errors:util.parseError(err)});
            console.log('error: ' + JSON.stringify(err));
            return res.redirect('/posts/' + post.id + res.locals.getPostQueryString());
        });
});

// update
router.put('/:id', util.isLoggedin, checkPermission, checkPostId, (req, res) => {
    var post = res.locals.post;

    console.log('parentComment:' + req.body.parentComment);
 
    req.body.updatedAt = Date.now();
    Comment.update(req.body, {where:{id:req.params.id}})
        .then(comment => {
            return res.redirect('/posts/' + post.id + res.locals.getPostQueryString());
        })
        .catch(err => {
            req.flash('commentForm', {id: req.params.id, form:req.body});
            req.flash('commentError', {id: req.params.id, parentComment:req.body.parentComment, errors:util.parseError(err) });
            return res.redirect('/posts/' + post.id + res.locals.getPostQueryString());
        });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, checkPostId, (reg, res) => {
    var post = res.locals.post;

    Comment.findOne({where:{id:req.params.id}})
        .then(comment => {
            // save update comment
            comment.idDeleted = true;
            comment.save()
                .then(comment => {
                    return res.redirect('/posts/' + post.id + res.locals.getPostQueryString());
                })
                .catch(err => {
                    res.json(err);
                });
        })
        .catch(err => {
            res.json(err);
        });
});

module.exports = router;

// private functions
function checkPermission(req, res, next) {
    Comment.findOne({where:{id:req.params.id}})
        .then(comment => {
            if (comment.UserId != req.user.id) return util.noPermission(req, res);
            next();
        })
        .catch(err => {
            res.json(err);
        });
}

function checkPostId(req, res, next) {
    Post.findOne({where:{id:req.query.postId}})
        .then(post => {
            console.log('post: ' + JSON.stringify(post));
            res.locals.post = post;
            next();
        })
        .catch(err => {
            console.log('error: ' + JSON.stringify(err));
            res.json(err)
        });
}