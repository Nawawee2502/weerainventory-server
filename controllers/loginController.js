const { User: userModel, Tbl_typeuser: Tbl_TypeuserModel } = require("../models/mainModel");

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
        { algorithm: 'HS256', expiresIn: 60 * 60 * 24 }
      );

      res
        .status(200)
        .send({ result: true, data: userData, tokenKey: token, message: "Login Success" });
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

exports.addUser = async (req, res) => {
  try {
    userModel.create({
      user_code: req.body.user_code,
      username: req.body.username,
      typeuser_code: req.body.typeuser_code,
      password: bcrypt.hashSync(req.body.password, 10),
      email: req.body.email,
      line_uid: req.body.line_uid
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateUser = async (req, res) => {
  try {
    userModel.update(
      {
        username: req.body.username,
        typeuser_code: req.body.typeuser_code,
        password: bcrypt.hashSync(req.body.password),
        email: req.body.email,
        line_uid: req.body.line_uid,

      },
      { where: { user_code: req.body.user_code } },
    ),
      res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteUser = async (req, res) => {
  try {
    userModel.destroy(
      { where: { user_code: req.body.user_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.userAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const userShow = await userModel.findAll({
      offset: offset,
      limit: limit,
      include: [{
        model: Tbl_TypeuserModel,
        required: false, // ใช้ LEFT JOIN
        foreignKey: 'typeuser_code'
      }]
    });
    res.status(200).send({ result: true, data: userShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getlastusercode = async (req, res) => {
  try {
    const lastusercode = await userModel.findOne({
      order: [['user_code', 'DESC']], // เรียงจากมากไปน้อย
      raw: true // เพื่อให้ได้ข้อมูลดิบไม่มี metadata
    });
    console.log('Last user code:', lastusercode); // เพิ่ม log เพื่อดูค่าที่ได้
    res.status(200).send({ result: true, data: lastusercode });
  } catch (error) {
    console.error('Error in getlastusercode:', error);
    res.status(500).send({ message: error });
  }
};

// userModel.update(
//   { username: req.boy.username },
//   { where: { user_code: req.body.user_code } }
// );

exports.countUser = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await userModel.count({
      where: {
        user_code: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchUserName = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { username } = await req.body;
    // console.log((typeproduct_name));


    const UserShow = await userModel.findAll({
      where: {
        username: {
          [Op.like]: `%${username}%`
        },
      }
    });
    res.status(200).send({ result: true, data: UserShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};