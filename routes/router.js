const {
  login,
  addUser,
  updateUser,
  userAll,
  deleteUser,
  getlastusercode,
  countUser,
  // updateLineUID,
  // checkLineUID,
  // lineCallback
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
  searchproduct,
  updateProductImage,
  searchProductsForImage,
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
  Wh_posAllrdate,
  refno,
  searchWh_posRunno,
  Wh_posByRefno,
  countWh_pos,
  getWhPosByRefno
} = require("../controllers/wh_posController")

const {
  addWh_posdt,
  updateWh_posdt,
  deleteWh_posdt,
  countWh_posdt,
  Wh_posdtAlljoindt,
  Wh_posdtAllinnerjoin,
} = require("../controllers/wh_posdtController")

const {
  addWh_rfs,
  updateWh_rfs,
  deleteWh_rfs,
  Wh_rfsAlljoindt,
  Wh_rfsAllrdate,
  Wh_rfsrefno,
  searchWh_rfsRunno,
  Wh_rfsByRefno,
  countWh_rfs,
  getWhRfsByRefno
} = require("../controllers/wh_rfsController")

const {
  addWh_rfsdt,
  updateWh_rfsdt,
  deleteWh_rfsdt,
  countWh_rfsdt,
  Wh_rfsdtAlljoindt,
  Wh_rfsdtAllinnerjoin,
} = require("../controllers/wh_rfsdtController")

const {
  addWh_dpk,
  updateWh_dpk,
  deleteWh_dpk,
  Wh_dpkAlljoindt,
  Wh_dpkAllrdate,
  Wh_dpkrefno,
  searchWh_dpkRunno,
  Wh_dpkByRefno,
  getWhDpkByRefno
} = require("../controllers/wh_dpkController")

const {
  addWh_dpkdt,
  updateWh_dpkdt,
  deleteWh_dpkdt,
  countWh_dpkdt,
  Wh_dpkdtAlljoindt,
  Wh_dpkdtAllinnerjoin,
} = require("../controllers/wh_dpkdtController")

const {
  addWh_rfk,
  updateWh_rfk,
  deleteWh_rfk,
  Wh_rfkAlljoindt,
  Wh_rfkAllrdate,
  Wh_rfkrefno,
  searchWh_rfkRunno,
  Wh_rfkByRefno,
  getWhRfkByRefno,
  Wh_rfkUsedRefnos
} = require("../controllers/wh_rfkController")

const {
  addWh_rfkdt,
  updateWh_rfkdt,
  deleteWh_rfkdt,
  countWh_rfkdt,
  Wh_rfkdtAlljoindt,
  Wh_rfkdtAllinnerjoin,
} = require("../controllers/wh_rfkdtController")

const {
  addWh_dpb,
  updateWh_dpb,
  deleteWh_dpb,
  Wh_dpbAlljoindt,
  Wh_dpbAllrdate,
  Wh_dpbrefno,
  searchWh_dpbRunno,
  Wh_dpbByRefno,
  countWh_dpb,
  getWhDpbByRefno,
  Wh_dpbUsedRefnos
} = require("../controllers/wh_dpbController")

const {
  addWh_dpbdt,
  updateWh_dpbdt,
  deleteWh_dpbdt,
  countWh_dpbdt,
  Wh_dpbdtAlljoindt,
  Wh_dpbdtAllinnerjoin,
} = require("../controllers/wh_dpbdtController")

const {
  addWh_saf,
  updateWh_saf,
  deleteWh_saf,
  Wh_safAlljoindt,
  Wh_safAllrdate,
  Wh_safrefno,
  searchWh_safRunno,
  Wh_safByRefno,
  getWhSafByRefno
} = require("../controllers/wh_safController")

const {
  addWh_safdt,
  updateWh_safdt,
  deleteWh_safdt,
  countWh_safdt,
  Wh_safdtAlljoindt,
  Wh_safdtAllinnerjoin,
} = require("../controllers/wh_safdtController")

const {
  addWh_stockcard,
  updateWh_stockcard,
  deleteWh_stockcard,
  countWh_stockcard,
  Query_Wh_stockcard,
} = require("../controllers/wh_stockcardController")

const {
  addWh_product_lotno,
  updatewh_product_lotno,
  deletewh_product_lotno,
  Query_wh_product_lotno,
} = require("../controllers/wh_product_lotnoController")


const {
  addKt_pow,
  updateKt_pow,
  deleteKt_pow,
  Kt_powAlljoindt,
  Kt_powAllrdate,
  Kt_powrefno,
  searchKt_powRunno,
  Kt_powByRefno,
  countKt_pow,
  getKtPowByRefno
} = require("../controllers/kt_powController")

const {
  addKt_powdt,
  updateKt_powdt,
  deleteKt_powdt,
  countKt_powdt,
  Kt_powdtAlljoindt,
  Kt_powAllinnerjoin,
} = require("../controllers/kt_powdtController")

const {
  addKt_rfs,
  updateKt_rfs,
  deleteKt_rfs,
  Kt_rfsAlljoindt,
  Kt_rfsAllrdate,
  Kt_rfsrefno,
  searchKt_rfsRunno,
  Kt_rfsByRefno,
  countKt_rfs,
  getKtRfsByRefno
} = require("../controllers/kt_rfsController")

const {
  addKt_rfsdt,
  updateKt_rfsdt,
  deleteKt_rfsdt,
  countKt_rfsdt,
  Kt_rfsdtAlljoindt,
  Kt_rfsAllinnerjoin,
} = require("../controllers/kt_rfsdtController")

const {
  addKt_rfw,
  updateKt_rfw,
  deleteKt_rfw,
  Kt_rfwAlljoindt,
  Kt_rfwAllrdate,
  Kt_rfwrefno,
  searchKt_rfwRunno,
  Kt_rfwByRefno,
  countKt_rfw,
  getUsedRefnosKt_rfw,
  getKtRfwByRefno
} = require("../controllers/kt_rfwController")

const {
  addKt_rfwdt,
  updateKt_rfwdt,
  deleteKt_rfwdt,
  countKt_rfwdt,
  Kt_rfwdtAlljoindt,
  Kt_rfwAllinnerjoin,
} = require("../controllers/kt_rfwdtController")

const {
  addKt_grf,
  updateKt_grf,
  deleteKt_grf,
  Kt_grfAlljoindt,
  Kt_grfAllrdate,
  Kt_grfrefno,
  searchKt_grfRunno,
  Kt_grfByRefno,
  getKtGrfByRefno
} = require("../controllers/kt_grfController")

const {
  addKt_grfdt,
  updateKt_grfdt,
  deleteKt_grfdt,
  countKt_grfdt,
  Kt_grfdtAlljoindt,
  Kt_grfAllinnerjoin,
} = require("../controllers/kt_grfdtController")

const {
  addKt_prf,
  updateKt_prf,
  deleteKt_prf,
  Kt_prfAlljoindt,
  Kt_prfAllrdate,
  Kt_prfrefno,
  searchKt_prfRunno,
  Kt_prfByRefno,
  getKtPrfByRefno
} = require("../controllers/kt_prfController")

const {
  addKt_prfdt,
  updateKt_prfdt,
  deleteKt_prfdt,
  countKt_prfdt,
  Kt_prfdtAlljoindt,
  Kt_prfAllinnerjoin,
} = require("../controllers/kt_prfdtController")

const {
  addKt_trw,
  updateKt_trw,
  deleteKt_trw,
  Kt_trwAlljoindt,
  Kt_trwAllrdate,
  Kt_trwrefno,
  searchKt_trwRunno,
  Kt_trwByRefno,
  getKtTrwByRefno
} = require("../controllers/kt_trwController")

const {
  addKt_trwdt,
  updateKt_trwdt,
  deleteKt_trwdt,
  countKt_trwdt,
  Kt_trwdtAlljoindt,
  Kt_trwAllinnerjoin,
} = require("../controllers/kt_trwdtController")

const {
  addKt_dpb,
  updateKt_dpb,
  deleteKt_dpb,
  Kt_dpbAlljoindt,
  Kt_dpbAllrdate,
  Kt_dpbrefno,
  searchKt_dpbRunno,
  Kt_dpbByRefno,
  getKtDpbByRefno
} = require("../controllers/kt_dpbController")

const {
  addKt_dpbdt,
  updateKt_dpbdt,
  deleteKt_dpbdt,
  countKt_dpbdt,
  Kt_dpbdtAlljoindt,
  Kt_dpbAllinnerjoin,
} = require("../controllers/kt_dpbdtController")

const {
  addKt_saf,
  updateKt_saf,
  deleteKt_saf,
  Kt_safAlljoindt,
  Kt_safAllrdate,
  Kt_safrefno,
  searchKt_safRunno,
  Kt_safByRefno,
  countKt_saf,
  getKtSafByRefno
} = require("../controllers/kt_safController")

const {
  addKt_safdt,
  updateKt_safdt,
  deleteKt_safdt,
  countKt_safdt,
  Kt_safdtAlljoindt,
  Kt_safAllinnerjoin,
} = require("../controllers/kt_safdtController")

const {
  addKt_stockcard,
  updateKt_stockcard,
  deleteKt_stockcard,
  countKt_stockcard,
  Kt_stockcardAll,
} = require("../controllers/kt_stockcardController")

//สาขา
// กำหนดจำนวนสินค้าขึ้นต่ำ
const {
  addBr_minnum_stock,
  updateBr_minnum_stock,
  deleteBr_minnum_stock,
  Query_Br_minnum_stock,
  SearchBr_minnum_stock,
  countBr_minnum_stock,
} = require("../controllers/br_minnum_stockContrller")

const {
  addBr_saf,
  updateBr_saf,
  deleteBr_saf,
  Br_safAlljoindt,
  Br_safAllrdate,
  Br_safrefno,
  searchBr_safRunno,
  Br_safByRefno,
  getSafByRefno
} = require("../controllers/br_safController")

const {
  addBr_safdt,
  updateBr_safdt,
  deleteBr_safdt,
  countBr_safdt,
  Br_safdtAlljoindt,
  Br_safAllinnerjoin,
} = require("../controllers/br_safdtController")

const {
  addBr_pow,
  updateBr_pow,
  deleteBr_pow,
  Br_powAlljoindt,
  Br_powAllrdate,
  Br_powrefno,
  searchBr_powRunno,
  Br_powByRefno,
  getPowByRefno,
  checkPowStatusForEdit,
  checkPOUsedInDispatch
} = require("../controllers/br_powController")

const {
  addBr_powdt,
  updateBr_powdt,
  deleteBr_powdt,
  countBr_powdt,
  Br_powdtAlljoindt,
  Br_powAllinnerjoin,
} = require("../controllers/br_powdtController")

const {
  addBr_rfw,
  updateBr_rfw,
  deleteBr_rfw,
  Br_rfwAlljoindt,
  Br_rfwAllrdate,
  Br_rfwrefno,
  searchBr_rfwRunno,
  Br_rfwByRefno,
  getUsedRefnosrfw,
  getRfwByRefno
} = require("../controllers/br_rfwController")

const {
  addBr_rfwdt,
  updateBr_rfwdt,
  deleteBr_rfwdt,
  countBr_rfwdt,
  Br_rfwdtAlljoindt,
  Br_rfwAllinnerjoin,
} = require("../controllers/br_rfwdtController")

const {
  addBr_rfk,
  updateBr_rfk,
  deleteBr_rfk,
  Br_rfkAlljoindt,
  Br_rfkAllrdate,
  Br_rfkrefno,
  searchBr_rfkRunno,
  Br_rfkByRefno,
  getUsedRefnos,
  getRfkByRefno
} = require("../controllers/br_rfkController")

const {
  addBr_rfkdt,
  updateBr_rfkdt,
  deleteBr_rfkdt,
  countBr_rfkdt,
  Br_rfkdtAlljoindt,
  Br_rfkAllinnerjoin,
} = require("../controllers/br_rfkdtController")

const {
  addBr_rfs,
  updateBr_rfs,
  deleteBr_rfs,
  Br_rfsAlljoindt,
  Br_rfsAllrdate,
  Br_rfsrefno,
  searchBr_rfsRunno,
  Br_rfsByRefno,
  getRfsByRefno
} = require("../controllers/br_rfsController")

const {
  addBr_rfsdt,
  updateBr_rfsdt,
  deleteBr_rfsdt,
  countBr_rfsdt,
  Br_rfsdtAlljoindt,
  Br_rfsAllinnerjoin,
} = require("../controllers/br_rfsdtController")

const {
  addBr_rtk,
  updateBr_rtk,
  deleteBr_rtk,
  Br_rtkAlljoindt,
  Br_rtkAllrdate,
  Br_rtkrefno,
  searchBr_rtkRunno,
  Br_rtkByRefno,
  countBr_rtk,
  getRtkByRefno
} = require("../controllers/br_rtkController")

const {
  addBr_rtkdt,
  updateBr_rtkdt,
  deleteBr_rtkdt,
  countBr_rtkdt,
  Br_rtkdtAlljoindt,
  Br_rtkdtAllinnerjoin,
} = require("../controllers/br_rtkdtController")

const {
  addBr_grf,
  updateBr_grf,
  deleteBr_grf,
  Br_grfAlljoindt,
  Br_grfAllrdate,
  Br_grfrefno,
  searchBr_grfRunno,
  Br_grfByRefno,
  getGrfByRefno
} = require("../controllers/br_grfController")

const {
  addBr_grfdt,
  updateBr_grfdt,
  deleteBr_grfdt,
  countBr_grfdt,
  Br_grfdtAlljoindt,
  Br_grfAllinnerjoin,
} = require("../controllers/br_grfdtController")

const {
  addBr_stockcard,
  updateBr_stockcard,
  deleteBr_stockcard,
  countBr_stockcard,
  Br_stockcardAll,
} = require("../controllers/br_stockcardController")


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
router.post("/userAll", userAll);
router.post("/deleteUser", deleteUser);
router.post('/getlastusercode', getlastusercode);
router.post('/countUser', countUser);
// router.post('/updateLineUID', updateLineUID);
// router.post("/callback", lineCallback);
// router.post("/checkLineUID", checkLineUID);

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
router.post("/searchproduct", searchproduct);
router.post("/updateproductimage", updateProductImage);
router.post("/searchproductsimage", searchProductsForImage);

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
router.post("/Wh_posAllrdate", Wh_posAllrdate);
router.post("/refno", refno);
router.post("/wh_posbyrefno", Wh_posByRefno);
router.post("/countwh_pos", countWh_pos);
router.post("/getWhPosByRefno", getWhPosByRefno);



router.post("/addWh_posdt", addWh_posdt);
router.post("/updatewh_posdt", updateWh_posdt);
router.post("/deletewh_posdt", deleteWh_posdt);
router.post("/countWh_posdt", countWh_posdt);
router.post("/Wh_posdtAlljoindt", Wh_posdtAlljoindt)
router.post("/searchWh_posRunno", searchWh_posRunno)

//ใบรับสินค้าจาก Supplier
router.post("/addWh_rfs", addWh_rfs);
router.post("/updateWh_rfs", updateWh_rfs);
router.post("/deleteWh_rfs", deleteWh_rfs);
router.post("/wh_rfsAlljoindt", Wh_rfsAlljoindt);
router.post("/Wh_rfsAllrdate", Wh_rfsAllrdate);
router.post("/Wh_rfsrefno", Wh_rfsrefno);
router.post("/wh_rfsbyrefno", Wh_rfsByRefno);
router.post("/searchWh_rfsRunno", searchWh_rfsRunno);
router.post("/countWh_rfs", countWh_rfs);
router.post("/getWhRfsByRefno", getWhRfsByRefno);


router.post("/addWh_rfsdt", addWh_rfsdt);
router.post("/updatewh_rfsdt", updateWh_rfsdt);
router.post("/deletewh_rfsdt", deleteWh_rfsdt);
router.post("/countWh_rfsdt", countWh_rfsdt);
router.post("/Wh_rfsdtAlljoindt", Wh_rfsdtAlljoindt)

//ใบส่งสินค้าให้ครัวกลาง
router.post("/addWh_dpk", addWh_dpk);
router.post("/updateWh_dpk", updateWh_dpk);
router.post("/deleteWh_dpk", deleteWh_dpk);
router.post("/wh_dpkAlljoindt", Wh_dpkAlljoindt);
router.post("/Wh_dpkAllrdate", Wh_dpkAllrdate);
router.post("/Wh_dpkrefno", Wh_dpkrefno);
router.post("/wh_dpkbyrefno", Wh_dpkByRefno);
router.post("/searchWh_dpkRunno", searchWh_dpkRunno);
router.post("/getWhDpkByRefno", getWhDpkByRefno);


router.post("/addWh_dpkdt", addWh_dpkdt);
router.post("/updatewh_dpkdt", updateWh_dpkdt);
router.post("/deletewh_dpkdt", deleteWh_dpkdt);
router.post("/countWh_dpkdt", countWh_dpkdt);
router.post("/Wh_dpkdtAlljoindt", Wh_dpkdtAlljoindt)

//ใบรับสินค้าจากครัวกลาง
router.post("/addWh_rfk", addWh_rfk);
router.post("/updateWh_rfk", updateWh_rfk);
router.post("/deleteWh_rfk", deleteWh_rfk);
router.post("/wh_rfkAlljoindt", Wh_rfkAlljoindt);
router.post("/Wh_rfkAllrdate", Wh_rfkAllrdate);
router.post("/Wh_rfkrefno", Wh_rfkrefno);
router.post("/wh_rfkbyrefno", Wh_rfkByRefno);
router.post("/searchWh_rfkRunno", searchWh_rfkRunno);
router.post("/getWhRfkByRefno", getWhRfkByRefno);
router.post("/wh-rfk-used-refnos", Wh_rfkUsedRefnos);

router.post("/addWh_rfkdt", addWh_rfkdt);
router.post("/updatewh_rfkdt", updateWh_rfkdt);
router.post("/deletewh_rfkdt", deleteWh_rfkdt);
router.post("/countWh_rfkdt", countWh_rfkdt);
router.post("/Wh_rfkdtAlljoindt", Wh_rfkdtAlljoindt)

//ใบส่งสินค้าให้สาขา
router.post("/addWh_dpb", addWh_dpb);
router.post("/updateWh_dpb", updateWh_dpb);
router.post("/deleteWh_dpb", deleteWh_dpb);
router.post("/wh_dpbAlljoindt", Wh_dpbAlljoindt);
router.post("/Wh_dpbAllrdate", Wh_dpbAllrdate);
router.post("/Wh_dpbrefno", Wh_dpbrefno);
router.post("/wh_dpbbyrefno", Wh_dpbByRefno);
router.post("/searchWh_dpbRunno", searchWh_dpbRunno);
router.post("/countWh_dpb", countWh_dpb);
router.post("/getWhDpbByRefno", getWhDpbByRefno);
router.post("/wh-dpb-used-refnos", Wh_dpbUsedRefnos);


router.post("/addWh_dpbdt", addWh_dpbdt);
router.post("/updatewh_dpbdt", updateWh_dpbdt);
router.post("/deletewh_dpbdt", deleteWh_dpbdt);
router.post("/countWh_dpbdt", countWh_dpbdt);
router.post("/Wh_dpbdtAlljoindt", Wh_dpbdtAlljoindt)

//ใบนับสต็อก
router.post("/addWh_saf", addWh_saf);
router.post("/updateWh_saf", updateWh_saf);
router.post("/deleteWh_saf", deleteWh_saf);
router.post("/wh_safAlljoindt", Wh_safAlljoindt);
router.post("/Wh_safAllrdate", Wh_safAllrdate);
router.post("/Wh_safrefno", Wh_safrefno);
router.post("/wh_safbyrefno", Wh_safByRefno);
router.post("/searchWh_safRunno", searchWh_safRunno);
router.post("/getWhSafByRefno", getWhSafByRefno);


router.post("/addWh_safdt", addWh_safdt);
router.post("/updatewh_safdt", updateWh_safdt);
router.post("/deletewh_safdt", deleteWh_safdt);
router.post("/countWh_safdt", countWh_safdt);
router.post("/Wh_safdtAlljoindt", Wh_safdtAlljoindt)

router.post("/addWh_stockcard", addWh_stockcard);
router.post("/updatewh_stockcard", updateWh_stockcard);
router.post("/deletewh_stockcard", deleteWh_stockcard);
router.post("/countWh_stockcard", countWh_stockcard);
router.post("/Query_Wh_stockcard", Query_Wh_stockcard);

router.post("/addWh_product_lotno", addWh_product_lotno);
router.post("/updatewh_product_lotno", updatewh_product_lotno);
router.post("/deletewh_product_lotno", deletewh_product_lotno);
router.post("/Query_wh_product_lotno", Query_wh_product_lotno);

//ครัวกลาง
//ใบนับสต็อก
router.post("/addKt_pow", addKt_pow);
router.post("/updateKt_pow", updateKt_pow);
router.post("/deleteKt_pow", deleteKt_pow);
router.post("/Kt_powAlljoindt", Kt_powAlljoindt);
router.post("/Kt_powAllrdate", Kt_powAllrdate);
router.post("/Kt_powrefno", Kt_powrefno);
router.post("/Kt_powbyrefno", Kt_powByRefno);
router.post("/searchKt_powRunno", searchKt_powRunno);
router.post("/countkt_pow", countKt_pow);
router.post("/getKtPowByRefno", getKtPowByRefno);


router.post("/addkt_powdt", addKt_powdt);
router.post("/updateKt_powdt", updateKt_powdt);
router.post("/deleteKt_powdt", deleteKt_powdt);
router.post("/countKt_powdt", countKt_powdt);
router.post("/Kt_powdtAlljoindt", Kt_powdtAlljoindt)

//ใบรับสินค้าจาก Supplier
router.post("/addKt_rfs", addKt_rfs);
router.post("/updateKt_rfs", updateKt_rfs);
router.post("/deleteKt_rfs", deleteKt_rfs);
router.post("/Kt_rfsAlljoindt", Kt_rfsAlljoindt);
router.post("/Kt_rfsAllrdate", Kt_rfsAllrdate);
router.post("/Kt_rfsrefno", Kt_rfsrefno);
router.post("/Kt_rfsbyrefno", Kt_rfsByRefno);
router.post("/searchKt_rfsRunno", searchKt_rfsRunno);
router.post("/countKt_rfs", countKt_rfs);
router.post("/getKtRfsByRefno", getKtRfsByRefno);


router.post("/addkt_rfsdt", addKt_rfsdt);
router.post("/updateKt_rfsdt", updateKt_rfsdt);
router.post("/deleteKt_rfsdt", deleteKt_rfsdt);
router.post("/countKt_rfsdt", countKt_rfsdt);
router.post("/Kt_rfsdtAlljoindt", Kt_rfsdtAlljoindt)

//ใบรับสินค้าจาก คลังสินค้า
router.post("/addKt_rfw", addKt_rfw);
router.post("/updateKt_rfw", updateKt_rfw);
router.post("/deleteKt_rfw", deleteKt_rfw);
router.post("/Kt_rfwAlljoindt", Kt_rfwAlljoindt);
router.post("/Kt_rfwAllrdate", Kt_rfwAllrdate);
router.post("/Kt_rfwrefno", Kt_rfwrefno);
router.post("/Kt_rfwbyrefno", Kt_rfwByRefno);
router.post("/searchKt_rfwRunno", searchKt_rfwRunno);
router.post("/countKt_rfw", countKt_rfw);
router.post('/kt-rfw-used-refnos', getUsedRefnosKt_rfw);
router.post("/getKtRfwByRefno", getKtRfwByRefno);


router.post("/addkt_rfwdt", addKt_rfwdt);
router.post("/updateKt_rfwdt", updateKt_rfwdt);
router.post("/deleteKt_rfwdt", deleteKt_rfwdt);
router.post("/countKt_rfwdt", countKt_rfwdt);
router.post("/Kt_rfwdtAlljoindt", Kt_rfwdtAlljoindt)

//ใบเบิกสินค้า
router.post("/addKt_grf", addKt_grf);
router.post("/updateKt_grf", updateKt_grf);
router.post("/deleteKt_grf", deleteKt_grf);
router.post("/Kt_grfAlljoindt", Kt_grfAlljoindt);
router.post("/Kt_grfAllrdate", Kt_grfAllrdate);
router.post("/Kt_grfrefno", Kt_grfrefno);
router.post("/Kt_grfbyrefno", Kt_grfByRefno);
router.post("/searchKt_grfRunno", searchKt_grfRunno);
router.post("/getKtGrfByRefno", getKtGrfByRefno);


router.post("/addkt_grfdt", addKt_grfdt);
router.post("/updateKt_grfdt", updateKt_grfdt);
router.post("/deleteKt_grfdt", deleteKt_grfdt);
router.post("/countKt_grfdt", countKt_grfdt);
router.post("/Kt_grfdtAlljoindt", Kt_grfdtAlljoindt)

//ใบรับสินค้าจากการผลิต
router.post("/addKt_prf", addKt_prf);
router.post("/updateKt_prf", updateKt_prf);
router.post("/deleteKt_prf", deleteKt_prf);
router.post("/Kt_prfAlljoindt", Kt_prfAlljoindt);
router.post("/Kt_prfAllrdate", Kt_prfAllrdate);
router.post("/Kt_prfrefno", Kt_prfrefno);
router.post("/Kt_prfbyrefno", Kt_prfByRefno);
router.post("/searchKt_prfRunno", searchKt_prfRunno);
router.post("/getKtPrfByRefno", getKtPrfByRefno);


router.post("/addkt_prfdt", addKt_prfdt);
router.post("/updateKt_prfdt", updateKt_prfdt);
router.post("/deleteKt_prfdt", deleteKt_prfdt);
router.post("/countKt_prfdt", countKt_prfdt);
router.post("/Kt_prfdtAlljoindt", Kt_prfdtAlljoindt)

//ใบโอนสินค้าให้คลังสินค้า
router.post("/addKt_trw", addKt_trw);
router.post("/updateKt_trw", updateKt_trw);
router.post("/deleteKt_trw", deleteKt_trw);
router.post("/Kt_trwAlljoindt", Kt_trwAlljoindt);
router.post("/Kt_trwAllrdate", Kt_trwAllrdate);
router.post("/Kt_trwrefno", Kt_trwrefno);
router.post("/Kt_trwbyrefno", Kt_trwByRefno);
router.post("/searchKt_trwRunno", searchKt_trwRunno);
router.post("/getKtTrwByRefno", getKtTrwByRefno);


router.post("/addkt_trwdt", addKt_trwdt);
router.post("/updateKt_trwdt", updateKt_trwdt);
router.post("/deleteKt_trwdt", deleteKt_trwdt);
router.post("/countKt_trwdt", countKt_trwdt);
router.post("/Kt_trwdtAlljoindt", Kt_trwdtAlljoindt)

//ใบส่งสินค้าให้สาขา
router.post("/addKt_dpb", addKt_dpb);
router.post("/updateKt_dpb", updateKt_dpb);
router.post("/deleteKt_dpb", deleteKt_dpb);
router.post("/Kt_dpbAlljoindt", Kt_dpbAlljoindt);
router.post("/Kt_dpbAllrdate", Kt_dpbAllrdate);
router.post("/Kt_dpbrefno", Kt_dpbrefno);
router.post("/Kt_dpbbyrefno", Kt_dpbByRefno);
router.post("/searchKt_dpbRunno", searchKt_dpbRunno);
router.post("/getKtDpbByRefno", getKtDpbByRefno);


router.post("/addkt_dpbdt", addKt_dpbdt);
router.post("/updateKt_dpbdt", updateKt_dpbdt);
router.post("/deleteKt_dpbdt", deleteKt_dpbdt);
router.post("/countKt_dpbdt", countKt_dpbdt);
router.post("/Kt_dpbdtAlljoindt", Kt_dpbdtAlljoindt)


//ใบปรับปรุงสินค้า
router.post("/addKt_saf", addKt_saf);
router.post("/updateKt_saf", updateKt_saf);
router.post("/deleteKt_saf", deleteKt_saf);
router.post("/Kt_safAlljoindt", Kt_safAlljoindt);
router.post("/Kt_safAllrdate", Kt_safAllrdate);
router.post("/Kt_safrefno", Kt_safrefno);
router.post("/Kt_safbyrefno", Kt_safByRefno);
router.post("/searchKt_safRunno", searchKt_safRunno)
router.post("/countKt_saf", countKt_saf);

router.post("/addKt_safdt", addKt_safdt);
router.post("/updateKt_safdt", updateKt_safdt);
router.post("/deleteKt_safdt", deleteKt_safdt);
router.post("/countKt_safdt", countKt_safdt);
router.post("/Kt_safdtAlljoindt", Kt_safdtAlljoindt);
router.post("/getKtSafByRefno", getKtSafByRefno);


router.post("/addKt_stockcard", addKt_stockcard);
router.post("/updateKt_stockcard", updateKt_stockcard);
router.post("/deleteKt_stockcard", deleteKt_stockcard);
router.post("/countKt_stockcard", countKt_stockcard);
router.post("/Kt_stockcardAll", Kt_stockcardAll)

//กำหนดจำนวนสินค้าขั้นต่ำ
router.post("/addBr_minnum_stock", addBr_minnum_stock);
router.post("/updateBr_minnum_stock", updateBr_minnum_stock);
router.post("/deleteBr_minnum_stock", deleteBr_minnum_stock);
router.post("/Query_Br_minnum_stock", Query_Br_minnum_stock);
router.post("/SearchBr_minnum_stock", SearchBr_minnum_stock);
router.post("/countBr_minnum_stock", countBr_minnum_stock);

// สาขา ใบปรับปรุงสินค้า
router.post("/addBr_saf", addBr_saf);
router.post("/updateBr_saf", updateBr_saf);
router.post("/deleteBr_saf", deleteBr_saf);
router.post("/Br_safAlljoindt", Br_safAlljoindt);
router.post("/Br_safAllrdate", Br_safAllrdate);
router.post("/Br_safrefno", Br_safrefno);
router.post("/Br_safbyrefno", Br_safByRefno);
router.post("/searchBr_safRunno", searchBr_safRunno);
router.post("/getSafByRefno", getSafByRefno);

router.post("/addBr_safdt", addBr_safdt);
router.post("/updateBr_safdt", updateBr_safdt);
router.post("/deleteBr_safdt", deleteBr_safdt);
router.post("/countBr_safdt", countBr_safdt);
router.post("/Br_safdtAlljoindt", Br_safdtAlljoindt)

// สาขา ใบสั่งสินค้าให้คลังสินค้า
router.post("/addBr_pow", addBr_pow);
router.post("/updateBr_pow", updateBr_pow);
router.post("/deleteBr_pow", deleteBr_pow);
router.post("/Br_powAlljoindt", Br_powAlljoindt);
router.post("/Br_powAllrdate", Br_powAllrdate);
router.post("/Br_powrefno", Br_powrefno);
router.post("/Br_powbyrefno", Br_powByRefno);
router.post("/searchBr_powRunno", searchBr_powRunno)
router.post("/getPowByRefno", getPowByRefno);
router.post("/checkPowStatusForEdit", checkPowStatusForEdit);
router.post("/checkPOUsedInDispatch", checkPOUsedInDispatch);

router.post("/addBr_powdt", addBr_powdt);
router.post("/updateBr_powdt", updateBr_powdt);
router.post("/deleteBr_powdt", deleteBr_powdt);
router.post("/countBr_powdt", countBr_powdt);
router.post("/Br_powdtAlljoindt", Br_powdtAlljoindt)

// สาขา ใบรับสินค้าจากคลังสินค้า
router.post("/addBr_rfw", addBr_rfw);
router.post("/updateBr_rfw", updateBr_rfw);
router.post("/deleteBr_rfw", deleteBr_rfw);
router.post("/Br_rfwAlljoindt", Br_rfwAlljoindt);
router.post("/Br_rfwAllrdate", Br_rfwAllrdate);
router.post("/Br_rfwrefno", Br_rfwrefno);
router.post("/Br_rfwbyrefno", Br_rfwByRefno);
router.post("/searchBr_rfwRunno", searchBr_rfwRunno);
router.post("/getRfwByRefno", getRfwByRefno);

router.post("/addBr_rfwdt", addBr_rfwdt);
router.post("/updateBr_rfwdt", updateBr_rfwdt);
router.post("/deleteBr_rfwdt", deleteBr_rfwdt);
router.post("/countBr_rfwdt", countBr_rfwdt);
router.post("/Br_rfwdtAlljoindt", Br_rfwdtAlljoindt);
router.post("/rfw-used-refnos", getUsedRefnosrfw);

// สาขา ใบรับสินค้าจากครัวกลาง
router.post("/addBr_rfk", addBr_rfk);
router.post("/updateBr_rfk", updateBr_rfk);
router.post("/deleteBr_rfk", deleteBr_rfk);
router.post("/Br_rfkAlljoindt", Br_rfkAlljoindt);
router.post("/Br_rfkAllrdate", Br_rfkAllrdate);
router.post("/Br_rfkrefno", Br_rfkrefno);
router.post("/Br_rfkbyrefno", Br_rfkByRefno);
router.post("/searchBr_rfkRunno", searchBr_rfkRunno);
router.post("/getRfkByRefno", getRfkByRefno);

router.post("/addBr_rfkdt", addBr_rfkdt);
router.post("/updateBr_rfkdt", updateBr_rfkdt);
router.post("/deleteBr_rfkdt", deleteBr_rfkdt);
router.post("/countBr_rfkdt", countBr_rfkdt);
router.post("/Br_rfkdtAlljoindt", Br_rfkdtAlljoindt)
router.post("/used-refnos", getUsedRefnos);

// สาขา ใบรับสินค้าจาก Supplier
router.post("/addBr_rfs", addBr_rfs);
router.post("/updateBr_rfs", updateBr_rfs);
router.post("/deleteBr_rfs", deleteBr_rfs);
router.post("/Br_rfsAlljoindt", Br_rfsAlljoindt);
router.post("/Br_rfsAllrdate", Br_rfsAllrdate);
router.post("/Br_rfsrefno", Br_rfsrefno);
router.post("/Br_rfsbyrefno", Br_rfsByRefno);
router.post("/searchBr_rfsRunno", searchBr_rfsRunno);
router.post("/getRfsByRefno", getRfsByRefno);

router.post("/addBr_rfsdt", addBr_rfsdt);
router.post("/updateBr_rfsdt", updateBr_rfsdt);
router.post("/deleteBr_rfsdt", deleteBr_rfsdt);
router.post("/countBr_rfsdt", countBr_rfsdt);
router.post("/Br_rfsdtAlljoindt", Br_rfsdtAlljoindt)

router.post("/addBr_rtk", addBr_rtk);
router.post("/updateBr_rtk", updateBr_rtk);
router.post("/deleteBr_rtk", deleteBr_rtk);
router.post("/Br_rtkAlljoindt", Br_rtkAlljoindt);
router.post("/Br_rtkAllrdate", Br_rtkAllrdate);
router.post("/Br_rtkrefno", Br_rtkrefno);
router.post("/Br_rtkbyrefno", Br_rtkByRefno);
router.post("/searchBr_rtkRunno", searchBr_rtkRunno);
router.post("/countBr_rtk", countBr_rtk);
router.post("/getRtkByRefno", getRtkByRefno);

router.post("/addBr_rtkdt", addBr_rtkdt);
router.post("/updateBr_rtkdt", updateBr_rtkdt);
router.post("/deleteBr_rtkdt", deleteBr_rtkdt);
router.post("/countBr_rtkdt", countBr_rtkdt);
router.post("/Br_rtkdtAlljoindt", Br_rtkdtAlljoindt);


// สาขา ใบเบิกสินค้า
router.post("/addBr_grf", addBr_grf);
router.post("/updateBr_grf", updateBr_grf);
router.post("/deleteBr_grf", deleteBr_grf);
router.post("/Br_grfAlljoindt", Br_grfAlljoindt);
router.post("/Br_grfAllrdate", Br_grfAllrdate);
router.post("/Br_grfrefno", Br_grfrefno);
router.post("/Br_grfbyrefno", Br_grfByRefno);
router.post("/searchBr_grfRunno", searchBr_grfRunno);
router.post("/getGrfByRefno", getGrfByRefno);

router.post("/addBr_grfdt", addBr_grfdt);
router.post("/updateBr_grfdt", updateBr_grfdt);
router.post("/deleteBr_grfdt", deleteBr_grfdt);
router.post("/countBr_grfdt", countBr_grfdt);
router.post("/Br_grfdtAlljoindt", Br_grfdtAlljoindt)

router.post("/addBr_stockcard", addBr_stockcard);
router.post("/updateBr_stockcard", updateBr_stockcard);
router.post("/deleteBr_stockcard", deleteBr_stockcard);
router.post("/countBr_stockcard", countBr_stockcard);
router.post("/Br_stockcardAll", Br_stockcardAll)

module.exports = router;
//(app) => {
//   router.post("/register",checkAuth, register);

//app.use("/api", router);
//app.use("/backend", router);
//};