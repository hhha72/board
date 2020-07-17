// routes/posts.js

var express  = require('express');
var router = express.Router();
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
var models = require('../models');
var User = models.User;
var Post = models.Post;
var File = models.File;
var Comment = models.Comment;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;
var util = require('../util');

// Index 
router.get('/', async function(req, res){
    var page = Math.max(1, req.query.page);
    var limit = Math.max(1, req.query.limit);

    page = !isNaN(page)?page:1;
    limit = !isNaN(limit)?limit:10;

    var searchQuery = createSearchQuery(req.query);

    var skip = (page - 1) * limit;
    var count = await Post.count({include:[{model:User}], where:searchQuery});
    if (limit > count) limit = count;
    var maxPage = Math.ceil(count/limit);
    console.log('limit: ' + limit);
    console.log('count: ' + count);
    console.log('maxPage: ' + maxPage);

    Post.findAll({
        //attributes:['Post.*', 'User.*', [Sequelize.fn('COUNT', Sequelize.col('Comments.id')), 'commentCount'], 'File.*'],
        include:[
            {model:User}, 
            {model: Comment, required:false }, 
            {model: File, where:{isDeleted:false}, required:false}
         ], 
        offset:skip, 
        limit:limit, 
        where:searchQuery,
        order:[['createdAt', 'DESC']]
    })
        .then(posts => {
            console.log('post: ' + JSON.stringify(posts));
            posts.forEach(post => { post.attachment = post.File; });
            res.render('posts/index', {
                posts:posts, 
                currentPage: page,
                maxPage: maxPage, 
                limit: limit, 
                searchType: req.query.searchType, 
                searchText: req.query.searchText
            });
        })
        .catch(err => {
            console.log('error: ' + JSON.stringify(err));
            return res.json(err);
        });
});

// New
router.get('/new', util.isLoggedin, function(req, res){
    var post = req.flash('post')[0] || {};
    var errors = req.flash('errors')[0] || {};
    res.render('posts/new', {post:post, errors:errors});
});

// create
router.post('/', util.isLoggedin, upload.single('attachment'), async function(req, res){
    console.log("req.user: " + JSON.stringify(req.user));
    if (!req.user) {
        res.redirect('/');
        return;
    }
    var attachment = req.file? await File.createNewInstance(req.file, req.user.id):undefined;
    req.body.attachment = attachment;
    req.body.UserId = req.user.id;
    Post.create(req.body)
        .then(post => {
            if (attachment) {
                attachment.PostId = post.id;
                attachment.save();
            }
            res.redirect('/posts' + res.locals.getPostQueryString(false, {page:1}));
        })
        .catch(err => {
            //if(err) return res.json(err);
            req.flash('post', req.body);
            req.flash('errors', util.parseError(err));
            return res.redirect('/posts/new' + res.locals.getPostQueryString());
        });
});

// show
router.get('/:id', function(req, res){
    var commentForm = req.flash('commentForm')[0] || {id:null, form:{}};
    var commentError = req.flash('commentError')[0] || {id:null, parentComment: null, errors:{}};

    Promise.all([
        Post.findOne({include:[{model:User}, {model:File, where:{isDeleted:false}, required:false}], where:{id:req.params.id}}), 
        Comment.findAll({include:[{model:User}], where:{PostId:req.params.id}})
    ])
        .then(result => {
            console.log('result: ' + JSON.stringify(result));
            var post = result[0];
            post.attachment = post.File;
            var comments = result[1];
            post.views += 1;
            post.save();
            var commentTrees = util.convertToTrees(comments, 'id', 'parentComment', 'childComments');
            res.render('posts/show', {post:post, commentTrees:commentTrees, commentForm:commentForm, commentError:commentError});
        })
        .catch(err => {
            console.log(err);
            res.json(err);
        });
});

// edit
router.get('/:id/edit', util.isLoggedin, checkPermission, function(req, res){
    var post = req.flash('post')[0];
    var errors = req.flash('errors')[0] || {};
    if (!post) {
        console.log('errors: ' + JSON.stringify(errors))
        Post.findOne({include:{model:File, where:{isDeleted:false}, required:false}, where:{id:req.params.id}})
        .then(post => {
            post.attachment = post.File;
            res.render('posts/edit', {post:post, errors:errors});
        })
        .catch(err => {
            return res.json(err);
        });
    }
    else {
        post.id = req.params.id;
        res.render('posts/edit', {post:post, errors:errors});
    }
});

// update
router.put('/:id', util.isLoggedin, checkPermission, upload.single('newAttachment'), async function(req, res){
    var file = await File.findOne({where:{PostId:req.params.id}});
    if (file && (req.file || !req.body.attachment)) {
        file.processDelete();
    }
    var attachment = req.file? await File.createNewInstance(req.file, req.user.id):undefined;
    /*
    const post = {
        title: req.body.title, 
        body: req.body.body, 
        createdAt: req.body.createdAt, 
        updatedAt: req.body.updatedAt
    }
    */
    req.body.updatedAt = Date.now();
    Post.update(req.body, {where:{id:req.params.id}})
        .then(post => {
            console.log('update-post:' + JSON.stringify(post));
            if (attachment) {
                attachment.PostId = req.params.id;
                attachment.save();
            }
            res.redirect("/posts/"+req.params.id + res.locals.getPostQueryString());
        })
        .catch(err => {
            console.log('update-err:' + JSON.stringify(err));
            //return res.json(err);
            req.flash('post', post);
            req.flash('errors', util.parseError(err));
            return res.redirect('/posts/' + req.params.id + '/edit' + res.locals.getPostQueryString());
        });
});

// destroy
router.delete('/:id', util.isLoggedin, checkPermission, function(req, res){
    Post.destroy({where:{id:req.params.id}})
        .then(() => {
            res.redirect('/posts' + res.locals.getPostQueryString());
        })
        .catch(err => {
            if(err) return res.json(err);
        });
});

function checkPermission(req, res, next) {
    Post.findOne({where:{id:req.params.id}})
        .then(post => {
            if (post.UserId != req.user.id) {
                return util.noPermission(req, res);
            }
            next();
        })
        .catch(err => {
            res.json(err);
        });
}

async function createSearchQuery(queries) {
    var searchQuery = {};
    if (queries.searchType && queries.searchText && queries.searchText.length >= 3) {
        var searchTypes = queries.searchType.toLowerCase().split(',');
        var queryArray = [];
        if (searchTypes.indexOf('title') >= 0) {
            queryArray.push({title: {[Op.like]: '%' + queries.searchText + '%' }});
        }
        if (searchTypes.indexOf('body') >= 0) {
            queryArray.push({body: {[Op.like]: '%' + queries.searchText + '%' }});
        }
        if (searchTypes.indexOf('author!') >= 0) {
            var user = await User.findOne({where:{username: queries.searchText }});
            if (user) queryArray.push({UserId: user.id });
        }
        else if (searchTypes.indexOf('author') >= 0) {
            var users = await User.findAll({where:{username: {[Op.like]:'%' + queries.searchText + '%'}}});
            if(users) {
                var userIds = [];
                for (var user of users) {
                    userIds.push(user.id);
                }
                if (userIds.length > 0) queryArray.push({UserId: {[Op.in]:userIds}});
            }
        }
        if (queryArray.length > 0) searchQuery = {[Op.or]: queryArray};
    }
    return searchQuery;
}

module.exports = router;
