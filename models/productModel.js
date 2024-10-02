module.exports = (sequelize, DataTypes) => {
    const ProductModel = sequelize.define(
      "tbl_product",
      {
        product_img: {
          type: DataTypes.STRING(255),
        },
        product_code: {
          type: DataTypes.STRING(10),
        },
        product_name: {
          type: DataTypes.STRING(255),
        },
        typeproduct_code: {
            type: DataTypes.STRING(10),
        },
        bulk_unit_code: {
            type: DataTypes.STRING(10),
        },
        bulk_unit_price: {
            type: DataTypes.DOUBLE(12,2),
        },
        retail_unit_code: {
            type: DataTypes.STRING(10),
        },
        retail_unit_price: {
            type: DataTypes.DOUBLE(12,2),
        },
        unit_conversion_factor: {
            type: DataTypes.DOUBLE(12,0),
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
    ProductModel.removeAttribute('id');
    return ProductModel;
  };