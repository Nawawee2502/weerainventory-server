module.exports = (sequelize, DataTypes) => {
  const UserModel = sequelize.define(
    "user",
    {
      user_code: {
        type: DataTypes.STRING(10),
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(100),
      },
      password: {
        type: DataTypes.STRING(100),
      },
      typeuser_code: {
        type: DataTypes.STRING(10),
      },
      email: {
        type: DataTypes.STRING(50),
      },
      line_uid: {
        type: DataTypes.STRING(100),
      },
      branch_code: {
        type: DataTypes.STRING(10),
      },
      kitchen_code: {
        type: DataTypes.STRING(10),
      }
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