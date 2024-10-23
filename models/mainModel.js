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

// Warehouse
db.Wh_stockcard = require("./wh_stockcardModel")(sequelize, Sequelize)
db.Wh_pos = require("./wh_posModel")(sequelize, Sequelize)
db.Wh_posdt = require("./wh_posdtModel")(sequelize, Sequelize)
db.Wh_saf = require("./wh_safModel")(sequelize, Sequelize)
db.Wh_safdt = require("./wh_safdtModel")(sequelize, Sequelize)
db.Wh_rfs = require("./wh_rfsModel")(sequelize, Sequelize)
db.Wh_rfsdt = require("./wh_rfsdtModel")(sequelize, Sequelize)
db.Wh_rfk = require("./wh_rfkModel")(sequelize, Sequelize)
db.Wh_rfkdt = require("./wh_rfkdtModel")(sequelize, Sequelize)
db.Wh_dpk = require("./wh_dpkModel")(sequelize, Sequelize)
db.Wh_dpkdt = require("./wh_dpkdtModel")(sequelize, Sequelize)
db.Wh_dpb = require("./wh_dpbModel")(sequelize, Sequelize)
db.Wh_dpbdt = require("./wh_dpbdtModel")(sequelize, Sequelize)

// Kitchen
db.Kt_stockcard = require("./kt_stockcardModel")(sequelize, Sequelize)
db.Kt_pow = require("./kt_powModel")(sequelize, Sequelize)
db.Kt_powdt = require("./kt_powdtModel")(sequelize, Sequelize)
db.Kt_rfs = require("./kt_rfsModel")(sequelize, Sequelize)
db.Kt_rfsdt = require("./kt_rfsdtModel")(sequelize, Sequelize)
db.Kt_rfw = require("./kt_rfwModel")(sequelize, Sequelize)
db.Kt_rfwdt = require("./kt_rfwdtModel")(sequelize, Sequelize)
db.Kt_grf = require("./kt_grfModel")(sequelize, Sequelize)
db.Kt_grfdt = require("./kt_grfdtModel")(sequelize, Sequelize)
db.Kt_prf = require("./kt_prfModel")(sequelize, Sequelize)
db.Kt_prfdt = require("./kt_prfdtModel")(sequelize, Sequelize)
db.Kt_trw = require("./kt_trwModel")(sequelize, Sequelize)
db.Kt_trwdt = require("./kt_trwdtModel")(sequelize, Sequelize)
db.Kt_dpb = require("./kt_dpbModel")(sequelize, Sequelize)
db.Kt_dpbdt = require("./kt_dpbdtModel")(sequelize, Sequelize)
db.Kt_saf = require("./kt_safModel")(sequelize, Sequelize)
db.Kt_safdt = require("./kt_safdtModel")(sequelize, Sequelize)


//branch
db.Br_stockcard = require("./br_stockcardModel")(sequelize, Sequelize)
db.Br_minnum_stock = require("./br_minnum_stockModel")(sequelize, Sequelize)
db.Br_saf = require("./br_safModel")(sequelize, Sequelize)
db.Br_safdt = require("./br_safdtModel")(sequelize, Sequelize)
db.Br_pow = require("./br_powModel")(sequelize, Sequelize)
db.Br_powdt = require("./br_powdtModel")(sequelize, Sequelize)
db.Br_rfw = require("./br_rfwModel")(sequelize, Sequelize)
db.Br_rfwdt = require("./br_rfwdtModel")(sequelize, Sequelize)
db.Br_rfk = require("./br_rfkModel")(sequelize, Sequelize)
db.Br_rfkdt = require("./br_rfkdtModel")(sequelize, Sequelize)
db.Br_rfs = require("./br_rfsModel")(sequelize, Sequelize)
db.Br_rfsdt = require("./br_rfsdtModel")(sequelize, Sequelize)
db.Br_grf = require("./br_grfModel")(sequelize, Sequelize)
db.Br_grfdt = require("./br_grfdtModel")(sequelize, Sequelize)

// inner join tbl_product
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


//inner join warehouse
// ใบสั่งสินค้าให้ Supplier
db.Wh_pos.hasMany(db.Wh_posdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno', // sourceKey ของ Product
});

db.Wh_posdt.belongsTo(db.Wh_pos, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno', // targetKey ของ Product
});

db.Wh_pos.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  targetKey: 'supplier_code', // sourceKey ของ Product
});
db.Tbl_supplier.hasMany(db.Wh_pos, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  sourceKey: 'supplier_code', // sourceKey ของ Product
});
db.Wh_pos.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Wh_pos, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});


db.Wh_posdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_posdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_posdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_posdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});


module.exports = db;