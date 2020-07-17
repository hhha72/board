//var sequelize = require('./Sequelize');
var Sequelize = require('sequelize');
var path = require('path');
var fs = require('fs')
var db = {};
var fs = require('fs')

var basename  = 'index.js';

// set database connection
const data = fs.readFileSync(__dirname + '/../config/Database.json');
const conf = JSON.parse(data);
var sequelize = new Sequelize(conf.database, conf.user, conf.password, {
    dialect: 'mysql', 
    host: conf.host,
    port: conf.port, 
    pool: {
        max: 10, 
        min: 0, 
        idle:10000
    }
});

console.log('before load table');
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        var model = sequelize['import'](path.join(__dirname, file));
        db[model.name] = model;
    });

Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        console.log('modelName: ' + modelName);
        db[modelName].associate(db);
    }
});

console.log('after load table');

sequelize.sync()
    .then(() => {
        console.log('finish load database');
    })
    .catch(err => {
        console.log(err);
    });

db.sequelize = sequelize;
db.Sequelize = Sequelize;


module.exports = db;