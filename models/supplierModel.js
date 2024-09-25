module.exports = (sequelize, DataTypes) => {
    const SupplierModel = sequelize.define(
      "tbl_supplier",
      {
        supplier_code: {
          type: DataTypes.STRING(10),
        },
        supplier_name: {
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
    SupplierModel.removeAttribute('id');
    return SupplierModel;
  };