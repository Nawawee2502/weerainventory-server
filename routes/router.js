const { login, addUser, updateUser, userAll, deleteUser } = require("../controllers/loginController");
const { addtypeproduct, updatetypeproduct, deletetypeproduct, typeproductAll, countProduct} = require("../controllers/tbl_typeproductController")

// const { checkAuth } = require("../middleware/checkAuth");
const router = require("express").Router();

module.exports = (app) => {
  //   router.post("/register",checkAuth, register);
  router.post("/login", login);
  //   router.post("/checkAuth", checkAuth);
  //   router.get("/getUser", getUser);

  router.post("/addUser", addUser);

  router.post("/updateUser", updateUser)

  router.get("/userAll", userAll)

  router.post("/deleteUser", deleteUser)

  
  // type_product
  router.post("/addTypeproduct",addtypeproduct)
  router.post("/updateTypeproduct",updatetypeproduct)
  router.post("/deleteTypeproduct",deletetypeproduct)
  router.post("/typeproductall",typeproductAll)
  router.post("/countproduct", countProduct)


  app.use("/api", router);
};