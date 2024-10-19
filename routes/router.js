const {
  login,
  addUser,
  updateUser,
  userAll,
  deleteUser,
} = require("../controllers/loginController");
const {
  addtypeproduct,
  updatetypeproduct,
  deletetypeproduct,
  typeproductAll,
  counttypeProduct,
  searchtypeProductName,
  typeproductcode,
} = require("../controllers/tbl_typeproductController");
const {
  addunit,
  updateunit,
  deleteunit,
  unitAll,
  countUnit,
  searchUnitName,
  unitcode,
} = require("../controllers/tbl_unitController");
const {
  addproduct,
  updateproduct,
  deleteproduct,
  productAll,
  countProduct,
  searchProductName,
  productcode,
  productAlltypeproduct,
  SearchProductCode,
} = require("../controllers/tbl_productController");
const {
  addbranch,
  updatebranch,
  deletebranch,
  branchAll,
  countBranch,
  searchBranchName,
  branchcode,
} = require("../controllers/tbl_branchModel");
const {
  addkitchen,
  updatekitchen,
  deletekitchen,
  kitchenAll,
  countKitchen,
  searchKitchenName,
  kitchencode,
} = require("../controllers/tbl_kitchenController");
const {
  addsupplier,
  updatesupplier,
  deletesupplier,
  supplierAll,
  countSupplier,
  searchSupplierName,
  suppliercode,
} = require("../controllers/tbl_supplierController");
const {
  addtypeuser,
  updatetypeuser,
  deletetypeuser,
  typeuserAll,
  counttypeUser,
  searchUserTypeName,
  typeUsercode,
} = require("../controllers/tbl_typeuserController");
const {
  addtypeuserpermission,
  updatetypeuserpermission,
  deletetypeuserpermission,
  typeuserpermissionAll,
  countTypeuserpermission,
} = require("../controllers/tbl_typeuserpermissionController");

const {
  addWh_pos,
  updateWh_pos,
  deleteWh_pos,
  Wh_posAlljoindt,
  Wh_posAllrdate
} = require("../controllers/wh_posController")

const {
  addWh_posdt,
  updateWh_posdt,
  deleteWh_posdt,
  countWh_posdt,
  Wh_posdtAlljoindt,
} = require("../controllers/wh_posdtController")

// const { checkAuth } = require("../middleware/checkAuth");
const router = require("express").Router();

// user
router.get("/testApi", (req, res) => {
  console.log("test pass...........");
  res.send("API Test Pass...........");
});

router.post("/login", login);
router.post("/addUser", addUser);
router.post("/updateUser", updateUser);
router.get("/userAll", userAll);
router.post("/deleteUser", deleteUser);

// type_product
router.post("/addTypeproduct", addtypeproduct);
router.post("/updateTypeproduct", updatetypeproduct);
router.post("/deleteTypeproduct", deletetypeproduct);
router.post("/typeproductall", typeproductAll);
router.post("/counttypeproduct", counttypeProduct);
router.post("/searchtypeproductname", searchtypeProductName);
router.post("/typeproductcode", typeproductcode);

// unit
router.post("/addunit", addunit);
router.post("/updateunit", updateunit);
router.post("/deleteunit", deleteunit);
router.post("/unitall", unitAll);
router.post("/countunit", countUnit);
router.post("/searchunitname", searchUnitName);
router.post("/unitcode", unitcode);

// product
router.post("/addproduct", addproduct);
router.post("/updateproduct", updateproduct);
router.post("/deleteproduct", deleteproduct);
router.post("/productall", productAll);
router.post("/countproduct", countProduct);
router.post("/searchproductname", searchProductName);
router.post("/productcode", productcode);
router.post("/productalltypeproduct", productAlltypeproduct);
router.post("/SearchProductCode", SearchProductCode);

// branch
router.post("/addbranch", addbranch);
router.post("/updatebranch", updatebranch);
router.post("/deletebranch", deletebranch);
router.post("/branchall", branchAll);
router.post("/countbranch", countBranch);
router.post("/searchbranchname", searchBranchName);
router.post("/branchcode", branchcode);

// kitchen
router.post("/addkitchen", addkitchen);
router.post("/updatekitchen", updatekitchen);
router.post("/deletekitchen", deletekitchen);
router.post("/kitchenall", kitchenAll);
router.post("/countKitchen", countKitchen);
router.post("/searchkitchenname", searchKitchenName);
router.post("/kitchencode", kitchencode);

// supplier
router.post("/addsupplier", addsupplier);
router.post("/updatesupplier", updatesupplier);
router.post("/deletesupplier", deletesupplier);
router.post("/supplierall", supplierAll);
router.post("/countSupplier", countSupplier);
router.post("/searchSuppliername", searchSupplierName);
router.post("/suppliercode", suppliercode);

// type_user
router.post("/addtypeuser", addtypeuser);
router.post("/updatetypeuser", updatetypeuser);
router.post("/deletetypeuser", deletetypeuser);
router.post("/typeuserall", typeuserAll);
router.post("/countTypeuser", counttypeUser);
router.post("/typeusercode", typeUsercode);
router.post("/searchtypeusername", searchUserTypeName);

// type_userpermission
router.post("/addtypeuserpermission", addtypeuserpermission);
router.post("/updatetypeuserpermission", updatetypeuserpermission);
router.post("/deletetypeuserpermission", deletetypeuserpermission);
router.post("/typeuserpermissionall", typeuserpermissionAll);
router.post("/countTypeuserpermissionall", countTypeuserpermission);

//warehouse
//ใบสั่งซ์้อสินค้าให้ Supplier
router.post("/addWh_pos", addWh_pos);
router.post("/updateWh_pos", updateWh_pos);
router.post("/deleteWh_pos", deleteWh_pos);
router.post("/wh_posAlljoindt", Wh_posAlljoindt);
router.post("/Wh_posAllrdate", Wh_posAllrdate)

router.post("/addWh_posdt", addWh_posdt);
router.post("/updatewh_posdt", updateWh_posdt);
router.post("/deletewh_posdt", deleteWh_posdt);
router.post("/countWh_posdt", countWh_posdt);
router.post("/Wh_posdtAlljoindt", Wh_posdtAlljoindt)

module.exports = router;
//(app) => {
//   router.post("/register",checkAuth, register);

//app.use("/api", router);
//app.use("/backend", router);
//};