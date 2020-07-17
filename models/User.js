// models/User.js
'use strict';
module.exports = (sequelize, DataTypes) => {
    var bcrypt = require('bcryptjs');

    var User = sequelize.define('User', {
        username:{
            type:DataTypes.STRING, 
            allowNull: false,
            validate:{
                notEmpty: { args: true, msg:'Username is required!'},
                notNull: {msg: 'Username is required!'}, 
                is:{args:/^.{4,12}$/, msg:'Should be 4-12 characters!'}
            },
            trim:true,
            unique:true
        }, 
        password: {
            type:DataTypes.STRING, 
            allowNull: false,
            validate:{
                notEmpty: { args: true, msg:'Password is required!'},
                notNull: {msg: 'Password is required!'}, 
                is:{
                    args:/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/, 
                    msg:'Should be minimum 8 characters of alphabet and number combination!'
                }
            },
            select:false
        }, 
        name: {
            type:DataTypes.STRING, 
            allowNull: false,
            validate:{
                notEmpty: { args: true, msg:'Name is required!'},
                notNull: {msg: 'Name is required!'}, 
                is:{args:/^.{4,12}$/, msg:'Should be 4-12 characters!'}
            },
            trim:true
        }, 
        email: {
            type:DataTypes.STRING, 
            validate:{
                is:{args:/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
                message:'Should be a vaild email address!'}
            },
            trim:true
        },
        passwordConfirmation:{type:DataTypes.VIRTUAL, 
            set(val) {this.setDataValue('passwordConfirmation', val)}, 
            get() {return this.getDataValue('passwordConfirmation')}
        }, 
        originalPassword: {type: DataTypes.VIRTUAL, 
            set(val) {this.setDataValue('originalPassword', val)}, 
            get() {return this.getDataValue('originalPassword')}
        }, 
        currentPassword: {type: DataTypes.VIRTUAL, 
            set(val) {this.setDataValue('currentPassword', val)}, 
            get() {return this.getDataValue('currentPassword')}
        }, 
        newPassword: {type:DataTypes.VIRTUAL, 
            set(val) {
                var passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,16}$/;
                var passwordRegexErrorMessage = 'Should be minimum 8 characters of alphabet and number combination!';
                if(val && !passwordRegex.test(val)){
                    var err = new Error(passwordRegexErrorMessage);
                    err.name = 'newPassword';
                    throw err;
                  }         
                this.setDataValue('newPassword', val);
            }, 
            get() {return this.getDataValue('newPassword')}
        }
    }, {
        tableName: 'user', 
        freezeTableName: true, 
        validate: {
            checkPassword() {
                var user = this;
                if (user.isNewRecord) {
                    if (!user.passwordConfirmation) {
                        var err = new Error('Password Confirmation is required.');
                        err.name='passwordConfirmation';
                        throw err;
                    }
                    if (user.passwordConfirmation !== user.password) {
                        var err = new Error('Password Confirmation does not matched!');
                        err.name='passwordConfirmation';
                        throw err;
                    }
                }
                else {
                    if (!user.currentPassword) {
                        var err = new Error('Current Password is required!');
                        err.name='currentPassword';
                        throw err;
                    }
    
                    if (!bcrypt.compareSync(user.currentPassword, user.originalPassword)) {
                        console.log('originalPassword: ' + user.originalPassword);
                        console.log('currentPassword: ' + user.currentPassword);
                        var err = new Error('Current Password is invalid!');
                        err.name='currentPassword';
                        throw err;
                    }
    
                    if (user.newPassword != user.passwordConfirmation) {
                        var err = new ValidationError('Password Confirmation does not matched!', {path:'passwordConfirmation'});
                        err.name='passwordConfirmation';
                        throw err;
                    }
                }
            }        
        },
        hooks: {
            beforeSave: (user, options) => {
                if (user.password == user.newPassword || user.password == user.passwordConfirmation) {
                    user.password = bcrypt.hashSync(user.password);
                }
            }
        }
    });
    
    User.associate = function(models) {
        models.User.hasMany(models.Post)
    }
    
    User.prototype.authenticate = function(password) {
        var user = this;
        return bcrypt.compareSync(password, user.password);
    }
    return User;
}
