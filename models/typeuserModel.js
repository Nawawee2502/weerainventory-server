module.exports = (sequelize, DataTypes) => {
    const Tbl_TypeuserModel = sequelize.define(
      "tbl_typeuser",
      {
        typeuser_code: {
          type: DataTypes.STRING(10),
        },
        typeuser_name: {
          type: DataTypes.STRING(255),
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
    Tbl_TypeuserModel.removeAttribute('id');
    return Tbl_TypeuserModel;
  };