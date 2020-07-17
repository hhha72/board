// models/Post.js
module.exports = (sequelize, DataTypes) => {
    var Post = sequelize.define('Post', {
        title: {
            type: DataTypes.STRING, 
            allowNull: false,
            validate: { 
                notEmpty: { args: true, msg:'Title is required!'},
                notNull: {msg: 'Title is required!'} 
            }
        }, 
        body: {
            type: DataTypes.STRING, 
            allowNull: false,
            validate: { 
                notEmpty: { args: true, msg:'Body is required!'},
                notNull: {msg:'Body is required!'}
            }
        }, 
        views:{type: DataTypes.INTEGER, defaultValue: 0},
        createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}, 
        updatedAt: {type: DataTypes.DATE}
    }, {
        tableName: 'post', 
        freezeTableName: true,
    });
    
    Post.associate = function(models) {
        models.Post.belongsTo(models.User);
        models.Post.hasOne(models.File);
        models.Post.hasMany(models.Comment);
    };
    return Post;
}
