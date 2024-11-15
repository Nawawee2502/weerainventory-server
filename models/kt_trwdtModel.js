module.exports = (sequelize, DataTypes) => {
    const kt_trwdtModel = sequelize.define(
      "kt_trwdt",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        product_code: {
          type: DataTypes.STRING(10),
        },
        expire_date: {
          type: DataTypes.STRING(10),
        },
        texpire_date: {
          type: DataTypes.STRING(10),
        },
        temperature1: {
          type: DataTypes.DOUBLE(12,2),
        },
        unit_code: {
          type: DataTypes.STRING(10),
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
    kt_trwdtModel.removeAttribute('id');
    return kt_trwdtModel;
  };