const { login, addUser, updateUser, userAll, deleteUser } = require("../controllers/loginController");
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

  app.use("/api", router);
};