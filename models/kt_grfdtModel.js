module.exports = (sequelize, DataTypes) => {
    const kt_grfdtModel = sequelize.define(
      "kt_grfdt",
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
    kt_grfdtModel.removeAttribute('id');
    return kt_grfdtModel;
  };