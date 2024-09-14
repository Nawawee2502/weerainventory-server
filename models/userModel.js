module.exports = (sequelize, DataTypes) => {
    const UserModel = sequelize.define(
      "user",
      {
        user_code: {
          type: DataTypes.STRING(100),
        },
        username: {
          type: DataTypes.STRING(100),
        },
        password: {
          type: DataTypes.STRING(100),
        },
        
      },
      {
        freezeTableName: true,
        // timestamp:false,
        id: false,
        createdAt: false,
        updatedAt: false,
      }
    );
    UserModel.removeAttribute('id');
    return UserModel;
  };