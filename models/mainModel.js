const Sequelize = require("sequelize");
const dbConfig = require("../config/dbConfig");

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.user,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    pool: {
      min: dbConfig.pool.min,
      max: dbConfig.pool.max,
      acquire: dbConfig.pool.acquire,
      idle: dbConfig.pool.idle,
    },
  }
);

const db = {}

db.sequelize = sequelize;
db.Sequelize = Sequelize;


db.User = require("./userModel")(sequelize, Sequelize)
db.Tbl_typeproduct = require("./typeproductModel")(sequelize, Sequelize)
db.Tbl_unit = require("./unitModel")(sequelize, Sequelize)
db.Tbl_product = require("./productModel")(sequelize, Sequelize)
db.Tbl_branch = require("./branchModel")(sequelize, Sequelize)
db.Tbl_kitchen = require("./kitchenModel")(sequelize, Sequelize)
db.Tbl_supplier = require("./supplierModel")(sequelize, Sequelize)
db.Tbl_typeuser = require("./typeuserModel")(sequelize, Sequelize)
db.Tbl_typeuserpermission = require("./typeuserpermissionModel")(sequelize, Sequelize)
db.Tbl_user = require("./userModel")(sequelize, Sequelize)


db.Tbl_product.hasMany(db.Tbl_typeproduct, {
  foreignKey: 'typeproduct_code',  // foreignKey ของ Type Product
  sourceKey: 'typeproduct_code' // sourceKey ของ Product
});

db.Tbl_typeproduct.belongsTo(db.Tbl_product, {
  foreignKey: 'typeproduct_code',  // foreignKey ของ Type Product
  targetKey: 'typeproduct_code' // targetKey ของ Product
});

db.Tbl_product.hasMany(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'bulk_unit_code', // sourceKey ของ Product
  as: 'productUnit1'
});

db.Tbl_unit.belongsTo(db.Tbl_product, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'bulk_unit_code', // targetKey ของ Product
  as: 'unitProduct1'
});

db.Tbl_product.hasMany(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'retail_unit_code', // sourceKey ของ Product
  as: 'productUnit2'
});

db.Tbl_unit.belongsTo(db.Tbl_product, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'retail_unit_code', // targetKey ของ Product
  as: 'unitProduct2'
});

module.exports = db;