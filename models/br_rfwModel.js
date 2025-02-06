module.exports = (sequelize, DataTypes) => {
  const Br_rfwModel = sequelize.define(
    "br_rfw",
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
      branch_code: {
        type: DataTypes.STRING(10),
      },
      supplier_code: {
        type: DataTypes.STRING(10),
      },
      taxable: {
        type: DataTypes.DOUBLE(12, 2),
      },
      nontaxable: {
        type: DataTypes.DOUBLE(12, 2),
      },
      total: {
        type: DataTypes.DOUBLE(12, 2),
      },
      user_code: {
        type: DataTypes.STRING(10),
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.literal('CURRENT_TIMESTAMP')
      }

    },
    {
      freezeTableName: true,
      // timestamp:false,
      id: false,
      createdAt: false,
      updatedAt: false,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );
  Br_rfwModel.removeAttribute('id');
  return Br_rfwModel;
};