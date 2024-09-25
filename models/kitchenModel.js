module.exports = (sequelize, DataTypes) => {
    const KitchenModel = sequelize.define(
      "tbl_kitchen",
      {
        kitchen_code: {
          type: DataTypes.STRING(10),
        },
        kitchen_name: {
          type: DataTypes.STRING(255),
        },
        addr1: {
            type: DataTypes.STRING(255),
        },
        addr2: {
            type: DataTypes.STRING(255),
        },
        tel1: {
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
    KitchenModel.removeAttribute('id');
    return KitchenModel;
  };