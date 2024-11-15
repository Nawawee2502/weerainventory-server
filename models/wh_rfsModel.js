module.exports = (sequelize, DataTypes) => {
    const Wh_rfsModel = sequelize.define(
      "wh_rfs",
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
        taxable: {
          type: DataTypes.DOUBLE(12,2),
        },
        nontaxable: {
          type: DataTypes.DOUBLE(12,2),
        },
        instant_saving: {
          type: DataTypes.DOUBLE(12,2),
        },
        delivery_surcharge: {
          type: DataTypes.DOUBLE(12,2),
        },
        sale_tax: {
          type: DataTypes.DOUBLE(12,2),
        },
        total: {
            type: DataTypes.DOUBLE(12,2),
        },
        total_due: {
          type: DataTypes.DOUBLE(12,2),
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
    Wh_rfsModel.removeAttribute('id');
    return Wh_rfsModel;
  };