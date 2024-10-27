module.exports = (sequelize, DataTypes) => {
    const Wh_posdtModel = sequelize.define(
      "wh_posdt",
      {
        refno: {
          type: DataTypes.STRING(20),
          primaryKey: true
        },
        product_code: {
          type: DataTypes.STRING(25),
          primaryKey: true
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
    Wh_posdtModel.removeAttribute('id');
    return Wh_posdtModel;
  };