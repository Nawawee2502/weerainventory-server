const db = require("../models/mainModel");
const userModel = db.Tbl_user;
const Tbl_TypeuserModel = db.Tbl_typeuser;

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res
        .status(400)
        .send({ message: "Username and Password is Required!" });

    // เพิ่ม include Tbl_TypeuserpermissionModel
    const userData = await userModel.findOne({
      where: { username: username },
      include: [{
        model: db.Tbl_typeuserpermission,
        required: false
      }]
    });

    if (userData && (await bcrypt.compare(password, userData.password))) {
      const token = jwt.sign(
        { username: userData.username, password: userData.password },
        process.env.ENCRYPT_TOKEN_KEY,
        { algorithm: 'HS256', expiresIn: 60 * 60 * 24 }
      );

      // ทดสอบดูข้อมูลที่จะส่งกลับ
      console.log("User data with permissions:", userData);

      res.status(200).send({
        result: true,
        data: userData,
        tokenKey: token,
        message: "Login Success"
      });
    } else {
      res.status(400).send({ result: false, message: "Invalid User or Password" });
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
    const updateData = {
      username: req.body.username,
      typeuser_code: req.body.typeuser_code,
      email: req.body.email,
      line_uid: req.body.line_uid,
    };

    // เพิ่ม password เฉพาะเมื่อมีการส่งมา
    if (req.body.password) {
      updateData.password = bcrypt.hashSync(req.body.password, 10);
    }

    await userModel.update(
      updateData,
      { where: { user_code: req.body.user_code } }
    );

    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
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
        required: false
      }]
    });
    res.status(200).send({ result: true, data: userShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getlastusercode = async (req, res) => {
  console.log('getlastusercode API called');
  try {
    const lastusercode = await userModel.findOne({
      order: [['user_code', 'DESC']],
      raw: true
    });

    console.log('Found last user code:', lastusercode);

    if (!lastusercode) {
      return res.status(200).send({
        result: true,
        data: { user_code: '001' }
      });
    }

    res.status(200).send({
      result: true,
      data: lastusercode
    });
  } catch (error) {
    console.error('Error in getlastusercode:', error);
    res.status(500).send({ message: error.message });
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