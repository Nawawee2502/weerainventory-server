const { login } = require("../controllers/loginController");
// const { checkAuth } = require("../middleware/checkAuth");
const router = require("express").Router();

module.exports = (app) => {
//   router.post("/register",checkAuth, register);
  router.post("/login", login);
//   router.post("/checkAuth", checkAuth);
//   router.get("/getUser", getUser);

  
  app.use("/api", router);
};