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


db.Tbl_product.belongsTo(db.Tbl_typeproduct, {
  foreignKey: 'typeproduct_code',  // foreignKey ของ Type Product
  targetKey: 'typeproduct_code' // sourceKey ของ Product
});

db.Tbl_typeproduct.hasMany(db.Tbl_product, {
  foreignKey: 'typeproduct_code',  // foreignKey ของ Type Product
  sourceKey: 'typeproduct_code' // targetKey ของ Product
});

db.Tbl_product.belongsTo(db.Tbl_unit, {
  foreignKey: 'bulk_unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
  as: 'productUnit1'
});

db.Tbl_unit.hasMany(db.Tbl_product, {
  foreignKey: 'bulk_unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // targetKey ของ Product
  as: 'unitProduct1'
});

db.Tbl_product.belongsTo(db.Tbl_unit, {
  foreignKey: 'retail_unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
  as: 'productUnit2'
});

db.Tbl_unit.hasMany(db.Tbl_product, {
  foreignKey: 'retail_unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // targetKey ของ Product
  as: 'unitProduct2'
});

module.exports = db;