module.exports = (sequelize, DataTypes) => {
  const Br_powModel = sequelize.define(
    "br_pow",
    {
      refno: {
        type: DataTypes.STRING(20),
      },
      rdate: {
        type: DataTypes.STRING(10),
      },
      trdate: {
        type: DataTypes.STRING(10),
      },
      myear: {
        type: DataTypes.STRING(10),
      },
      monthh: {
        type: DataTypes.INTEGER,
      },
      supplier_code: {
        type: DataTypes.STRING(10),
      },
      branch_code: {
        type: DataTypes.STRING(10),
      },
      total: {
        type: DataTypes.DOUBLE(12, 2),
      },
      taxable: {
        type: DataTypes.DOUBLE(12, 2),
      },
      nontaxable: {
        type: DataTypes.DOUBLE(12, 2),
      },
      status: {
        type: DataTypes.STRING(10),
      },
      user_code: {
        type: DataTypes.STRING(10),
      },
      created_at: {
        type: DataTypes.STRING(50),
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
  Br_powModel.removeAttribute('id');
  return Br_powModel;
};