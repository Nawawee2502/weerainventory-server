module.exports = (sequelize, DataTypes) => {
  const kt_powdtModel = sequelize.define(
    "kt_powdt",
    {
      refno: {
        type: DataTypes.STRING(20),
      },
      product_code: {
        type: DataTypes.STRING(10),
      },
      unit_code: {
        type: DataTypes.STRING(10),
      },
      tax1: {
        type: DataTypes.STRING(10),
      },
      qty: {
        type: DataTypes.DOUBLE(12, 2),
      },
      uprice: {
        type: DataTypes.DOUBLE(12, 2),
      },
      amt: {
        type: DataTypes.DOUBLE(12, 2),
      },
      qty_send: {
        type: DataTypes.DOUBLE(12, 2),
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
  kt_powdtModel.removeAttribute('id');
  return kt_powdtModel;
};