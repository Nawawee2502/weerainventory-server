module.exports = (sequelize, DataTypes) => {
    const Wh_dpkdtModel = sequelize.define(
      "wh_dpkdt",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        product_code: {
          type: DataTypes.STRING(25),
        },
        unit_code: {
          type: DataTypes.STRING(25),
        },
        qty: {
            type: DataTypes.DOUBLE(12,2),
        },
        uprice: {
            type: DataTypes.DOUBLE(12,2),
        },
        amt: {
            type: DataTypes.DOUBLE(12,2),
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
    Wh_dpkdtModel.removeAttribute('id');
    return Wh_dpkdtModel;
  };