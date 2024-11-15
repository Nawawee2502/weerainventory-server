module.exports = (sequelize, DataTypes) => {
    const Br_rfsModel = sequelize.define(
      "br_rfs",
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
          type: DataTypes.DOUBLE(12,2),
        },
        nontaxable: {
          type: DataTypes.DOUBLE(12,2),
        },
        total: {
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
    Br_rfsModel.removeAttribute('id');
    return Br_rfsModel;
  };