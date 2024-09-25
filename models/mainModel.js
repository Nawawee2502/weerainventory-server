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


db.User = require("./userModel")(sequelize,Sequelize)
db.Tbl_typeproduct = require("./typeproductModel")(sequelize,Sequelize)
db.Tbl_unit = require("./unitModel")(sequelize,Sequelize)
db.Tbl_product = require("./productModel")(sequelize,Sequelize)
db.Tbl_branch = require("./branchModel")(sequelize,Sequelize)
db.Tbl_kitchen = require("./kitchenModel")(sequelize,Sequelize)
db.Tbl_supplier = require("./supplierModel")(sequelize,Sequelize)
db.Tbl_typeuser = require("./typeuserModel")(sequelize,Sequelize)
db.Tbl_typeuserpermission = require("./typeuserpermissionModel")(sequelize,Sequelize)
db.Tbl_user = require("./userModel")(sequelize,Sequelize)

module.exports = db;