// models/File.js
'use strict';
var fs = require('fs');
var path = require('path');

module.exports = (sequelize, DataTypes) => {
    var File = sequelize.define('File', {
        originalFileName: {type: DataTypes.STRING}, 
        serverFileName: {type: DataTypes.STRING}, 
        size: {type: DataTypes.INTEGER},
        isDeleted: {type: DataTypes.BOOLEAN, defaultValue: false} 
    }, {
        tableName: 'file', 
        freezeTableName: true
    });

    File.associate = function(models) {
        models.File.belongsTo(models.Post);
        models.File.belongsTo(models.User);
    };

    File.createNewInstance = async (file, uploadedBy, postId) => {
        return await File.create({
            originalFileName: file.originalname, 
            serverFileName: file.filename,
            size: file.size, 
            UserId: uploadedBy, 
            PostId: postId
        });
    }

    File.prototype.processDelete = function() {
        var file = this;
        file.isDeleted = true;
        file.save();
    }

    File.prototype.getFileStream = function() {
        var stream;
        var file = this;
        var filePath = path.join(__dirname, '..', 'uploads', this.serverFileName);
        console.log('File Path: ' + filePath);
        var fileExists = fs.existsSync(filePath);
        console.log('fileExists: ' + fileExists);

        if(fileExists) {
            stream = fs.createReadStream(filePath);
        }
        else {
            file.processDelete();
        }
        return stream;
    }

    return File;
}