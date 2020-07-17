// util.js

var util = {}

// support function
util.parseError = (errors) => {
    var parsed = {};
    console.log('errors => ' + JSON.stringify(errors));

    if (errors.name == 'SequelizeValidationError') {
        for(var name in errors.errors) {
            var validationError = errors.errors[name];
            var name2 = validationError.path;
            if (typeof validationError.original.name != 'undefined' && validationError.original.name !== 'Error') {
                name2 = validationError.original.name;
            }
            console.log('errors['+ name2 + '] => ' + JSON.stringify(validationError));
            parsed[name2] = { message: validationError.message };
        }
    }
    else if (errors.code == '11000' && errors.errmsg.indexOf('username') > 0) {
        parsed.username = { message: 'This username already exists!'};
    }
    else {
        parsed.unhandled = JSON.stringify(errors);
    }
    return parsed;
}

util.isLoggedin = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    }
    else {
        req.flash('errors', {login:'Please Login first'});
        res.redirect('/login');
    }
}

util.noPermission = (req, res) => {
    req.flash('errors', {login:'You don\'t have permission'});
    req.logout();
    res.redirect('/login');
}

util.getPostQueryString = (req, res, next) => {
    res.locals.getPostQueryString = (isAppended=false, overwrites={}) => {
        var queryString = '';
        var queryArray = [];

        var page = overwrites.page ? overwrites.page:(req.query.page?req.query.page:'');
        var limit = overwrites.limit ? overwrites.limit:(req.query.limit?req.query.limit:'');
        var searchType = overwrites.searchType ? overwrites.searchType:(req.query.searchType?req.query.searchType:'');
        var searchText = overwrites.searchText ? overwrites.searchText:(req.query.searchText?req.query.searchText:'');

        if (page) queryArray.push('page=' + page);
        if (limit) queryArray.push('limit=' + limit);
        if (searchType) queryArray.push('searchType=' + searchType);
        if (searchText) queryArray.push('searchText=' + searchText);

        if (queryArray.length > 0) queryString = isAppended?'&':'?' + queryArray.join('&');

        return queryString;
    }
    next();
}

util.convertToTrees = (array, idFieldName, parentIdFieldName, childrenFieldName) => {
    var cloned = array.slice();

    for (var i = cloned.length - 1; i >= 1; i--) {
        var parentId = cloned[i][parentIdFieldName];

        if (parentId) {
            var filtered = array.filter((element) => {
                return element[idFieldName].toString() == parentId.toString();
            });

            if (filtered.length) {
                var parent = filtered[0];

                if (parent[childrenFieldName]) {
                    parent[childrenFieldName].push(cloned[i]);
                }
                else {
                    parent[childrenFieldName] = cloned[i];
                }
            }
            cloned.splice(i, 1);
        }
    }

    return cloned;
}

util.bytesToSize = (bytes) => {
    var units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + units[i];
}

module.exports = util;