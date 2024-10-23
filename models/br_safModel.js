module.exports = (sequelize, DataTypes) => {
    const Br_safModel = sequelize.define(
      "br_saf",
      {
        refno: {
          type: DataTypes.STRING(20),
        },
        rdate: {
          type: DataTypes.STRING(25),
        },
        trdate: {
            type: DataTypes.STRING(25),
        },
        myear: {
            type: DataTypes.STRING(25),
        },
        monthh: {
            type: DataTypes.INTEGER,
        },
        kitchen_code: {
            type: DataTypes.STRING(10),
        },
        branch_code: {
            type: DataTypes.STRING(10),
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
    Br_safModel.removeAttribute('id');
    return Br_safModel;
  };