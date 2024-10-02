const { login, addUser, updateUser, userAll, deleteUser } = require("../controllers/loginController");
const { addtypeproduct, updatetypeproduct, deletetypeproduct, typeproductAll,counttypeProduct, searchtypeProductName, typeproductcode} = require("../controllers/tbl_typeproductController")
const { addunit, updateunit, deleteunit, unitAll,countUnit} = require("../controllers/tbl_unitController")
const { addproduct, updateproduct, deleteproduct, productAll,countProduct} = require("../controllers/tbl_productController")
const { addbranch, updatebranch, deletebranch, branchAll,countBranch} = require("../controllers/tbl_branchModel")
const { addkitchen, updatekitchen, deletekitchen, kitchenAll,countKitchen} = require("../controllers/tbl_kitchenController")
const { addsupplier, updatesupplier, deletesupplier, supplierAll,countSupplier} = require("../controllers/tbl_supplierController")
const { addtypeuser, updatetypeuser, deletetypeuser, typeuserAll,counttypeUser} = require("../controllers/tbl_typeuserController")
const { addtypeuserpermission, updatetypeuserpermission, deletetypeuserpermission, typeuserpermissionAll,countTypeuserpermission} = require("../controllers/tbl_typeuserpermissionController")


// const { checkAuth } = require("../middleware/checkAuth");
const router = require("express").Router();

module.exports = (app) => {
  //   router.post("/register",checkAuth, register);

  // user
  router.post("/login", login);
  router.post("/addUser", addUser);
  router.post("/updateUser", updateUser)
  router.get("/userAll", userAll)
  router.post("/deleteUser", deleteUser)

  // type_product
  router.post("/addTypeproduct",addtypeproduct)
  router.post("/updateTypeproduct",updatetypeproduct)
  router.post("/deleteTypeproduct",deletetypeproduct)
  router.post("/typeproductall",typeproductAll)
  router.post("/counttypeproduct",counttypeProduct)
  router.post("/searchtypeproductname", searchtypeProductName)
  router.post("/typeproductcode", typeproductcode)

  // unit
  router.post("/addunit",addunit)
  router.post("/updateunit",updateunit)
  router.post("/deleteunit",deleteunit)
  router.post("/unitall",unitAll)
  router.post("/countunit",countUnit)

  // product
  router.post("/addproduct",addproduct)
  router.post("/updateproduct",updateproduct)
  router.post("/deleteproduct",deleteproduct)
  router.post("/productall",productAll)
  router.post("/countproduct",countProduct)

  // branch
  router.post("/addbranch",addbranch)
  router.post("/updatebranch",updatebranch)
  router.post("/deletebranch",deletebranch)
  router.post("/branchall",branchAll)
  router.post("/countbranch",countBranch)

  // kitchen
  router.post("/addkitchen",addkitchen)
  router.post("/updatekitchen",updatekitchen)
  router.post("/deletekitchen",deletekitchen)
  router.post("/kitchenall",kitchenAll)
  router.post("/countKitchen",countKitchen)

  // supplier
  router.post("/addsupplier",addsupplier)
  router.post("/updatesupplier",updatesupplier)
  router.post("/deletesupplier",deletesupplier)
  router.post("/supplierall",supplierAll)
  router.post("/countSupplier",countSupplier)

  // type_user
  router.post("/addtypeuser",addtypeuser)
  router.post("/updatetypeuser",updatetypeuser)
  router.post("/deletetypeuser",deletetypeuser)
  router.post("/typeuserall",typeuserAll)
  router.post("/countTypeuser",counttypeUser)

  // type_userpermission
  router.post("/addtypeuserpermission",addtypeuserpermission)
  router.post("/updatetypeuserpermission",updatetypeuserpermission)
  router.post("/deletetypeuserpermission",deletetypeuserpermission)
  router.post("/typeuserpermissionall",typeuserpermissionAll)
  router.post("/countTypeuserpermissionall",countTypeuserpermission)

  app.use("/api", router);
};