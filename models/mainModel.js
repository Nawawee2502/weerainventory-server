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
db.Tbl_user = require("./userModel")(sequelize, Sequelize)
db.Tbl_typeuser = require("./typeuserModel")(sequelize, Sequelize)

//set User
db.Tbl_typeuser = require("./typeuserModel")(sequelize, Sequelize)
db.Tbl_typeuserpermission = require("./typeuserpermissionModel")(sequelize, Sequelize)
db.Tbl_user = require("./userModel")(sequelize, Sequelize)

//manager User
// db.Tbl_user.hasMany(db.Tbl_typeuser, {
//   foreignKey: 'typeuser_code',  // foreignKey ของ Type Product
//   sourceKey: 'typeuser_code' // sourceKey ของ Product
//   // as: 'postoposdt'
// });

// // *********************แก้ไขใหม่*********************
// db.Tbl_typeuser.belongsTo(db.Tbl_user, {
//   foreignKey: 'typeuser_code',  // foreignKey ของ Type Product
//   targetKey: 'typeuser_code' // targetKey ของ Product
//   // as: 'posdttopos'
// });

// typeuser permission
db.Tbl_typeuserpermission.hasMany(db.Tbl_user, {
  foreignKey: 'typeuser_code',
  sourceKey: 'typeuser_code'
});

db.Tbl_user.belongsTo(db.Tbl_typeuserpermission, {
  foreignKey: 'typeuser_code',
  targetKey: 'typeuser_code'
});

// ความสัมพันธ์ระหว่าง User และ Type User
db.Tbl_typeuser.hasMany(db.Tbl_user, {
  foreignKey: 'typeuser_code',
  sourceKey: 'typeuser_code'
});

db.Tbl_user.belongsTo(db.Tbl_typeuser, {
  foreignKey: 'typeuser_code',
  targetKey: 'typeuser_code'
});

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




// Warehouse
db.Wh_stockcard = require("./wh_stockcardModel")(sequelize, Sequelize)
db.Wh_product_lotno = require("./wh_product_lotnoModel")(sequelize, Sequelize)
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

// // report wh_pos
// db.Wh_pos.belongsTo(db.Tbl_user, {
//   foreignKey: 'user_code',
//   targetKey: 'user_code'
// });

// db.Tbl_user.hasMany(db.Wh_pos, {
//   foreignKey: 'user_code',
//   sourceKey: 'user_code'
// });

db.Wh_pos.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Wh_pos, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'wh_pos'
});

//inner join warehouse
//stock card
db.Wh_stockcard.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_stockcard, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_stockcard.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_stockcard, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

//product_lotno
db.Wh_product_lotno.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_product_lotno, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_product_lotno.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_product_lotno, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});



// ใบสั่งสินค้าให้ Supplier

// *********************แก้ไขใหม่*********************
db.Wh_pos.hasMany(db.Wh_posdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_posdt.belongsTo(db.Wh_pos, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
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

db.Wh_pos.hasMany(db.Wh_posdt, {
  foreignKey: 'refno',
  sourceKey: 'refno'
});

db.Wh_posdt.belongsTo(db.Wh_pos, {
  foreignKey: 'refno',
  targetKey: 'refno'
});


//inner join warehouse
// ใบรับสินค้าจาก Supplier

// Report
db.Wh_rfs.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Wh_rfs, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'wh_rfs'
});

// *********************แก้ไขใหม่*********************
db.Wh_rfs.hasMany(db.Wh_rfsdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_rfsdt.belongsTo(db.Wh_rfs, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Wh_rfs.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  targetKey: 'supplier_code', // sourceKey ของ Product
});
db.Tbl_supplier.hasMany(db.Wh_rfs, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  sourceKey: 'supplier_code', // sourceKey ของ Product
});
db.Wh_rfs.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Wh_rfs, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});


db.Wh_rfsdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_rfsdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_rfsdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_rfsdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

//ใบส่งสินค้าให้ครัวกลาง
db.Wh_dpk.hasMany(db.Wh_dpkdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_dpkdt.belongsTo(db.Wh_dpk, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});



db.Wh_dpk.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Wh_dpk, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'wh_dpk'
});


db.Wh_dpk.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Wh_dpk, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});



db.Wh_dpkdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_dpkdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_dpkdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_dpkdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});


//ใบรับสินค้าจากครัวกลาง

db.Wh_rfk.hasMany(db.Wh_rfkdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_rfkdt.belongsTo(db.Wh_rfk, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Wh_rfk.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Wh_rfk, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});

db.Wh_rfk.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Wh_rfk, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'wh_rfk'
});

db.Wh_rfkdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_rfkdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_rfkdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_rfkdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});


//ใบส่งสินค้าให้สาขา
db.Wh_dpb.hasMany(db.Wh_dpbdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_dpbdt.belongsTo(db.Wh_dpb, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});

db.Wh_dpb.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Wh_dpb, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'wh_dpb'
});


db.Wh_dpb.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Wh_dpb, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});



db.Wh_dpbdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_dpbdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_dpbdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_dpbdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

//ใบนับสต็อก
db.Wh_saf.hasMany(db.Wh_safdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Wh_safdt.belongsTo(db.Wh_saf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});



db.Wh_safdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Wh_safdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Wh_safdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Wh_safdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});


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

//stock card
db.Kt_stockcard.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_stockcard, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_stockcard.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_stockcard, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// ใบสั่งสินค้าให้ Warehouse

// *********************แก้ไขใหม่*********************
db.Kt_pow.hasMany(db.Kt_powdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_powdt.belongsTo(db.Kt_pow, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_pow.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_pow, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});



db.Kt_powdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_powdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_powdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_powdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});


// ใบรับสินค้าจากSupplier

// *********************แก้ไขใหม่*********************
db.Kt_rfs.hasMany(db.Kt_rfsdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_rfsdt.belongsTo(db.Kt_rfs, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_rfs.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_rfs, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});
db.Kt_rfs.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  targetKey: 'supplier_code', // sourceKey ของ Product
});
db.Tbl_supplier.hasMany(db.Kt_rfs, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  sourceKey: 'supplier_code', // sourceKey ของ Product
});



db.Kt_rfsdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_rfsdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_rfsdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_rfsdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// เพิ่มใน mainModel.js
db.Kt_rfs.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_rfs, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_rfs'
});

// For Unit
db.Kt_rfsdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code'
});

db.Tbl_unit.hasMany(db.Kt_rfsdt, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code'
});

// For Product
db.Kt_rfsdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});

db.Tbl_product.hasMany(db.Kt_rfsdt, {
  foreignKey: 'product_code',
  sourceKey: 'product_code'
});

// Add user association for kt_rfw
db.Kt_rfw.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_rfw, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_rfw'
});

// Add associations for kt_rfwdt
db.Kt_rfw.hasMany(db.Kt_rfwdt, {
  foreignKey: 'refno',
  sourceKey: 'refno'
});

db.Kt_rfwdt.belongsTo(db.Kt_rfw, {
  foreignKey: 'refno',
  targetKey: 'refno'
});

// For Unit
db.Kt_rfwdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code'
});

db.Tbl_unit.hasMany(db.Kt_rfwdt, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code'
});

// For Product
db.Kt_rfwdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});

db.Tbl_product.hasMany(db.Kt_rfwdt, {
  foreignKey: 'product_code',
  sourceKey: 'product_code'
});


// ใบรับสินค้าจาก warehouse

// *********************แก้ไขใหม่*********************
db.Kt_rfw.hasMany(db.Kt_rfwdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_rfwdt.belongsTo(db.Kt_rfw, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_rfw.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_rfw, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});




db.Kt_rfwdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_rfwdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_rfwdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_rfwdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

db.Kt_rfw.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',
  targetKey: 'supplier_code'
});

db.Tbl_supplier.hasMany(db.Kt_rfw, {
  foreignKey: 'supplier_code',
  sourceKey: 'supplier_code'
});

// ใบเบิกสินค้า

// *********************แก้ไขใหม่*********************
db.Kt_grf.hasMany(db.Kt_grfdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_grfdt.belongsTo(db.Kt_grf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_grf.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_grf, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});




db.Kt_grfdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_grfdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_grfdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_grfdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

db.Kt_grf.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_grf, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_grf'
});

// ใบรับสินค้าจากการผลิต

// *********************แก้ไขใหม่*********************
db.Kt_prf.hasMany(db.Kt_prfdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_prfdt.belongsTo(db.Kt_prf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_prf.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_prf, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});




db.Kt_prfdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_prfdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_prfdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_prfdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});
db.Kt_prf.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_prf, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_prf'
});

// ใบโอนสินค้าให้ Warehouse

// *********************แก้ไขใหม่*********************
db.Kt_trw.hasMany(db.Kt_trwdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_trwdt.belongsTo(db.Kt_trw, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_trw.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_trw, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});




db.Kt_trwdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_trwdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_trwdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_trwdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});
db.Kt_trw.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_trw, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_trw'
});

// ใบส่งสินค้าให้ Branch

// *********************แก้ไขใหม่*********************
db.Kt_dpb.hasMany(db.Kt_dpbdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_dpbdt.belongsTo(db.Kt_dpb, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});

// เพิ่ม associations สำหรับ kt_pow กับ user
db.Kt_pow.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_pow, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_pow'
});

// เพิ่ม associations สำหรับ kt_pow กับ kitchen
db.Kt_pow.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',
  targetKey: 'kitchen_code',
});

db.Tbl_kitchen.hasMany(db.Kt_pow, {
  foreignKey: 'kitchen_code',
  sourceKey: 'kitchen_code',
});

// เพิ่ม associations สำหรับ kt_pow กับ kt_powdt
db.Kt_pow.hasMany(db.Kt_powdt, {
  foreignKey: 'refno',
  sourceKey: 'refno'
});

db.Kt_powdt.belongsTo(db.Kt_pow, {
  foreignKey: 'refno',
  targetKey: 'refno'
});

// เพิ่ม associations สำหรับ kt_powdt กับ tbl_product และ tbl_unit
db.Kt_powdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});

db.Tbl_product.hasMany(db.Kt_powdt, {
  foreignKey: 'product_code',
  sourceKey: 'product_code'
});

db.Kt_powdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code'
});

db.Tbl_unit.hasMany(db.Kt_powdt, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code'
});


// ความสัมพันธ์กับ Product
db.Kt_powdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});

db.Tbl_product.hasMany(db.Kt_powdt, {
  foreignKey: 'product_code',
  sourceKey: 'product_code'
});


db.Kt_dpb.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_dpb, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});
db.Kt_dpb.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Kt_dpb, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});

// เพิ่มความสัมพันธ์สำหรับ Kt_dpbdt กับ Tbl_product และ productUnit
db.Kt_dpbdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code',
  include: [
    {
      model: db.Tbl_unit,
      as: 'productUnit1'
    },
    {
      model: db.Tbl_unit,
      as: 'productUnit2'
    }
  ]
});

// เพิ่มความสัมพันธ์เฉพาะเจาะจงระหว่าง Kt_dpbdt และ Tbl_product รวมถึง units
db.Kt_dpbdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});



db.Kt_dpbdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_dpbdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_dpbdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_dpbdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

db.Kt_dpb.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_dpb, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_dpb'
});

db.Kt_stockcard.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',
  targetKey: 'kitchen_code'
});
db.Tbl_kitchen.hasMany(db.Kt_stockcard, {
  foreignKey: 'kitchen_code',
  sourceKey: 'kitchen_code'
});

db.Kt_stockcard.belongsTo(db.Tbl_unit, {  // เพิ่ม relation กับ unit
  foreignKey: 'unit_code',
  targetKey: 'unit_code'
});

db.Tbl_unit.hasMany(db.Kt_stockcard, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code'
});

// ใบปรับปรุงสินค้า
// *********************แก้ไขใหม่*********************
db.Kt_saf.hasMany(db.Kt_safdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Kt_safdt.belongsTo(db.Kt_saf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Kt_saf.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Kt_saf, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});


db.Kt_safdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Kt_safdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Kt_safdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Kt_safdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// Add user association for kt_saf
db.Kt_saf.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Kt_saf, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'kt_saf'
});


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
db.Br_rtk = require("./br_rtkModel")(sequelize, Sequelize)
db.Br_rtkdt = require("./br_rtkdtModel")(sequelize, Sequelize)


//stock card
db.Br_stockcard.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_stockcard, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_stockcard.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_stockcard, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

//stock card relationships
db.Br_stockcard.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code'
});
db.Tbl_unit.hasMany(db.Br_stockcard, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code'
});

db.Br_stockcard.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code'
});
db.Tbl_product.hasMany(db.Br_stockcard, {
  foreignKey: 'product_code',
  sourceKey: 'product_code'
});

db.Br_stockcard.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',
  targetKey: 'branch_code'
});
db.Tbl_branch.hasMany(db.Br_stockcard, {
  foreignKey: 'branch_code',
  sourceKey: 'branch_code'
});

db.Tbl_unit.hasMany(db.Br_minnum_stock, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Tbl_product.hasMany(db.Br_minnum_stock, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

db.Tbl_branch.hasMany(db.Br_minnum_stock, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product  
  sourceKey: 'branch_code', // sourceKey ของ Product
});

db.Br_minnum_stock.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code',
  as: 'tbl_product'  // Add this alias to match what's used in the controller
});

db.Br_minnum_stock.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code',
  as: 'tbl_unit'  // Add this alias to match what's used in the controller
});

db.Br_minnum_stock.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',
  targetKey: 'branch_code',
  as: 'tbl_branch'
});



// ใบปรับปรุงสินค้า
// *********************แก้ไขใหม่*********************
db.Br_saf.hasMany(db.Br_safdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_safdt.belongsTo(db.Br_saf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Br_saf.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_saf, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});


db.Br_safdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_safdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_safdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_safdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// ใบสั่งสินค้าให้คลังสินค้า
// *********************แก้ไขใหม่*********************
db.Br_pow.hasMany(db.Br_powdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_powdt.belongsTo(db.Br_pow, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Br_pow.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_pow, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});
db.Br_pow.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  targetKey: 'supplier_code', // sourceKey ของ Product
});
db.Tbl_supplier.hasMany(db.Br_pow, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  sourceKey: 'supplier_code', // sourceKey ของ Product
});

db.Br_pow.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_pow, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_pow'
});


db.Br_powdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_powdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_powdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_powdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// ใบรับสินค้าจากคลังสินค้า
// *********************แก้ไขใหม่*********************
db.Br_rfw.hasMany(db.Br_rfwdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_rfwdt.belongsTo(db.Br_rfw, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});

db.Br_rfw.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_rfw, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_rfw'
});


db.Br_rfw.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_rfw, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});

db.Br_rfwdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_rfwdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_rfwdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_rfwdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

db.Br_rfw.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',
  targetKey: 'supplier_code'
});

db.Tbl_supplier.hasMany(db.Br_rfw, {
  foreignKey: 'supplier_code',
  sourceKey: 'supplier_code'
});

// ใบรับสินค้าจากครัวกลาง
// *********************แก้ไขใหม่*********************
db.Br_rfk.hasMany(db.Br_rfkdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_rfkdt.belongsTo(db.Br_rfk, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});

db.Br_rfk.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_rfk, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_rfk'
});


db.Br_rfk.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  targetKey: 'kitchen_code', // sourceKey ของ Product
});
db.Tbl_kitchen.hasMany(db.Br_rfk, {
  foreignKey: 'kitchen_code',  // foreignKey ของ Type Product
  sourceKey: 'kitchen_code', // sourceKey ของ Product
});
db.Br_rfk.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_rfk, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});

db.Br_rfkdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_rfkdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_rfkdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_rfkdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// ใบรับสินค้าจาก Supplier
// *********************แก้ไขใหม่*********************
db.Br_rfs.hasMany(db.Br_rfsdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_rfsdt.belongsTo(db.Br_rfs, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});

db.Br_rfs.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_rfs, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_rfs'
});

db.Br_rfs.belongsTo(db.Tbl_supplier, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  targetKey: 'supplier_code', // sourceKey ของ Product
});
db.Tbl_supplier.hasMany(db.Br_rfs, {
  foreignKey: 'supplier_code',  // foreignKey ของ Type Product
  sourceKey: 'supplier_code', // sourceKey ของ Product
});
db.Br_rfs.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_rfs, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});

db.Br_rfsdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_rfsdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_rfsdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_rfsdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// br_rtk relationships
db.Br_rtk.hasMany(db.Br_rtkdt, {
  foreignKey: 'refno',  // foreignKey of br_rtkdt
  sourceKey: 'refno' // sourceKey of br_rtk
});

db.Br_rtkdt.belongsTo(db.Br_rtk, {
  foreignKey: 'refno',  // foreignKey of br_rtkdt
  targetKey: 'refno' // targetKey of br_rtk
});

db.Br_rtk.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',
  targetKey: 'branch_code',
});

db.Tbl_branch.hasMany(db.Br_rtk, {
  foreignKey: 'branch_code',
  sourceKey: 'branch_code',
});

db.Br_rtk.belongsTo(db.Tbl_kitchen, {
  foreignKey: 'kitchen_code',
  targetKey: 'kitchen_code',
});

db.Tbl_kitchen.hasMany(db.Br_rtk, {
  foreignKey: 'kitchen_code',
  sourceKey: 'kitchen_code',
});

db.Br_rtk.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_rtk, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_rtk'
});

db.Br_rtkdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',
  targetKey: 'unit_code',
});

db.Tbl_unit.hasMany(db.Br_rtkdt, {
  foreignKey: 'unit_code',
  sourceKey: 'unit_code',
});

db.Br_rtkdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',
  targetKey: 'product_code',
});

db.Tbl_product.hasMany(db.Br_rtkdt, {
  foreignKey: 'product_code',
  sourceKey: 'product_code',
});



// ใบเบิกสินค้า
// *********************แก้ไขใหม่*********************
db.Br_grf.hasMany(db.Br_grfdt, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  sourceKey: 'refno' // sourceKey ของ Product
  // as: 'postoposdt'
});

// *********************แก้ไขใหม่*********************
db.Br_grfdt.belongsTo(db.Br_grf, {
  foreignKey: 'refno',  // foreignKey ของ Type Product
  targetKey: 'refno' // targetKey ของ Product
  // as: 'posdttopos'
});


db.Br_grf.belongsTo(db.Tbl_branch, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  targetKey: 'branch_code', // sourceKey ของ Product
});
db.Tbl_branch.hasMany(db.Br_grf, {
  foreignKey: 'branch_code',  // foreignKey ของ Type Product
  sourceKey: 'branch_code', // sourceKey ของ Product
});

db.Br_grfdt.belongsTo(db.Tbl_unit, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  targetKey: 'unit_code', // sourceKey ของ Product
});
db.Tbl_unit.hasMany(db.Br_grfdt, {
  foreignKey: 'unit_code',  // foreignKey ของ Type Product
  sourceKey: 'unit_code', // sourceKey ของ Product
});

db.Br_grfdt.belongsTo(db.Tbl_product, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  targetKey: 'product_code', // sourceKey ของ Product
});
db.Tbl_product.hasMany(db.Br_grfdt, {
  foreignKey: 'product_code',  // foreignKey ของ Type Product
  sourceKey: 'product_code', // sourceKey ของ Product
});

// Add user association for br_grf
db.Br_grf.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_grf, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_grf'
});

db.Br_saf.belongsTo(db.User, {
  foreignKey: 'user_code',
  targetKey: 'user_code',
  as: 'user'
});

db.User.hasMany(db.Br_saf, {
  foreignKey: 'user_code',
  sourceKey: 'user_code',
  as: 'br_saf'
});


module.exports = db;