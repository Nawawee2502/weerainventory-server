module.exports = (sequelize, Sequelize) => {
  const Br_minnum_stock = sequelize.define("br_minnum_stock", {
    product_code: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    branch_code: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    unit_code: {
      type: Sequelize.STRING
    },
    min_qty: {
      type: Sequelize.DECIMAL(12, 2)
    }
  },
    {
      timestamps: false, // Disable createdAt and updatedAt
      freezeTableName: true, // Use the same table name
      tableName: 'br_minnum_stock' // Specify table name explicitly
    });

  return Br_minnum_stock;
};