const userModel = require("../models/mainModel").User;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


exports.login = async (req, res) => {
    try {
      // Split Json Data to Field
      const { username, password } = req.body;
  
      // Validate Field
      if (!username || !password)
        return res
          .status(400)
          .send({ message: "Username and Password is Required!" });
  
      //See All Attribute
      const userData = await userModel.findOne({ where: { username: username } });
  
      if (userData && (await bcrypt.compare(password, userData.password))) {
  
        const token = jwt.sign(
          { username: userData.username, password: userData.password },
          process.env.ENCRYPT_TOKEN_KEY,
          { algorithm: 'HS256',expiresIn: 60*60*24 }
        );
  
        res
          .status(200)
          .send({ result: true, data: userData,tokenKey:token, message: "Login Success" });
      } else {
        res
          .status(400)
          .send({ result: false, message: "Invalid User or Password" });
      }
    } catch (err) {
      console.log(err);
      res.status(500).send({ message: "Internal Server Error!!" });
    }
  };