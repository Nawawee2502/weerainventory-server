module.exports = (sequelize, DataTypes) => {
    const Wh_dpbdtModel = sequelize.define(
      "wh_dpbdt",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        product_code: {
          type: DataTypes.STRING(25),
        },
        expire_date: {
          type: DataTypes.STRING(25),
        },
        texpire_date: {
          type: DataTypes.STRING(25),
        },
        tax1: {
          type: DataTypes.STRING(10),
        },
        temperature1: {
          type: DataTypes.DOUBLE(12,2),
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
    Wh_dpbdtModel.removeAttribute('id');
    return Wh_dpbdtModel;
  };