module.exports = (sequelize, DataTypes) => {
  const Wh_product_lotnoModel = sequelize.define(
    "wh_product_lotno",
    {
      product_code: {
        type: DataTypes.STRING(10),
      },
      lotno: {
        type: DataTypes.INTEGER,
      },
      unit_code: {
        type: DataTypes.STRING(10),
      },
      qty: {
        type: DataTypes.DOUBLE(12, 2),
      },
      uprice: {
        type: DataTypes.DOUBLE(12, 2),
      },
      refno: {
        type: DataTypes.STRING(20),
      },
      qty_use: {
        type: DataTypes.DOUBLE(12, 2),
      },
      rdate: {
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
  Wh_product_lotnoModel.removeAttribute('id');
  return Wh_product_lotnoModel;
};