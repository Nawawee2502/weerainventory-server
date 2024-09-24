module.exports = (sequelize, DataTypes) => {
    const Tbl_TypeproductModel = sequelize.define(
      "tbl_typeproduct",

      {
        typeproduct_id: {
          type: DataTypes.INTEGER,
        },
        typeproduct_code: {
          type: DataTypes.STRING(10),
        },
        typeproduct_name: {
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
    Tbl_TypeproductModel.removeAttribute('id');
    return Tbl_TypeproductModel;
  };