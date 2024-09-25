module.exports = (sequelize, DataTypes) => {
    const BranchModel = sequelize.define(
      "tbl_branch",
      {
        branch_code: {
          type: DataTypes.STRING(10),
        },
        branch_name: {
          type: DataTypes.STRING(255),
        },
        addr1: {
            type: DataTypes.STRING(255),
        },
        addr2: {
            type: DataTypes.STRING(255),
        },
        tel1: {
            type: DataTypes.STRING(255),
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
    BranchModel.removeAttribute('id');
    return BranchModel;
  };