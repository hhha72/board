module.exports = (sequelize, DataTypes) => {
    var Comment = sequelize.define('Comment', {
        parentComment: {type:DataTypes.INTEGER}, 
        text: {
            type:DataTypes.STRING, 
            allowNull: false, 
            validate : {
                notEmpty: { args: true, msg:'text is required!'},
                notNull: { msg : 'text is required!'}
            }
        },
        isDeleted: {type: DataTypes.BOOLEAN}, 
        createdAt: {type: DataTypes.DATE, defaultValue: DataTypes.NOW}, 
        updatedAt: {type: DataTypes.DATE},
        childComments : {
            type: DataTypes.VIRTUAL, 
            set(value) { this.setDataValue('childComments', value); }, 
            get() { return this.getDataValue('childComments'); }
        }
    }, {
        tableName: 'comment', 
        freezeTableName: true, 
    });
    Comment.associate = function(models) {
        models.Comment.belongsTo(models.User);
        models.Comment.belongsTo(models.Post);
    };
    return Comment;
}