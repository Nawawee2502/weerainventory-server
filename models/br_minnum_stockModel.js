module.exports = (sequelize, DataTypes) => {
    const Br_minnum_stockModel = sequelize.define(
      "br_minnum_stock",
      {
        branch_code: {
          type: DataTypes.STRING(10),
        },
        product_code: {
            type: DataTypes.STRING(10),
        },
        unit_code: {
            type: DataTypes.STRING(10),
        },
        min_qty: {
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
    Br_minnum_stockModel.removeAttribute('id');
    return Br_minnum_stockModel;
  };