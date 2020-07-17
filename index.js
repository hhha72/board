var express = require('express');
var http = require('http');
const bodyParser = require('body-parser');
var methodOverride = require('method-override');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('./config/passport');
var util = require('./util');

// set server settungs
var app = express();
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.use(flash());
app.use(session({secret:'direction0708', resave:true, saveUninitialized:true}));
app.use(passport.initialize());
app.use(passport.session());

// Custom Middlewares
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;
    res.locals.util = util;
    next();
});

// set routes
app.use('/', require('./routes/home'));
app.use('/posts', util.getPostQueryString, require('./routes/posts'));
app.use('/users', require('./routes/users'));
app.use('/comments', util.getPostQueryString, require('./routes/comments'));
app.use('/files', require('./routes/files'));

// set port
app.set('port', process.env.PORT || 2020);

// listen server
http.createServer(app).listen(app.get('port'), () => {
    console.log('Server running at http://127.0.0.1:' + app.get('port'))
});
