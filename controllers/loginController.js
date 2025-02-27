const db = require("../models/mainModel");
const userModel = db.Tbl_user;
const Tbl_TypeuserModel = db.Tbl_typeuser;
const axios = require('axios');

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");


exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send({
        success: false,
        message: "Username and Password are required!"
      });
    }

    const userData = await userModel.findOne({
      where: { username: username },
      include: [
        {
          model: db.Tbl_typeuserpermission,
          required: false
        },
        {
          model: Tbl_TypeuserModel,
          required: false
        }]
    });

    if (userData && (await bcrypt.compare(password, userData.password))) {
      const token = jwt.sign(
        { username: userData.username },
        process.env.ENCRYPT_TOKEN_KEY,
        { algorithm: 'HS256', expiresIn: '24h' }
      );

      res.status(200).send({
        success: true,
        data: userData,
        userData2: userData,  // Include userData2
        tokenKey: token,
        message: "Login successful"
      });
    } else {
      res.status(400).send({
        success: false,
        message: "Invalid username or password"
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({
      success: false,
      message: "Internal server error"
    });
  }
};

exports.addUser = async (req, res) => {
  try {
    const {
      user_code,
      username,
      password,
      typeuser_code,
      email,
      line_uid,
      branch_code,
      kitchen_code
    } = req.body;

    await userModel.create({
      user_code,
      username,
      password: bcrypt.hashSync(password, 10),
      typeuser_code,
      email,
      line_uid,
      branch_code: branch_code || null,
      kitchen_code: kitchen_code || null
    });

    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const {
      user_code,
      username,
      password,
      typeuser_code,
      email,
      line_uid,
      branch_access_type,
      kitchen_access_type,
      branch_code,
      kitchen_code
    } = req.body;

    const updateData = {
      username,
      typeuser_code,
      email,
      line_uid,
      // แก้ไขการกำหนดค่า branch_code
      branch_code: branch_access_type === 'all' ? 'All' :
        branch_access_type === 'no_permission' ? 'No' :
          branch_code || 'No',
      // แก้ไขการกำหนดค่า kitchen_code             
      kitchen_code: kitchen_access_type === 'all' ? 'All' :
        kitchen_access_type === 'no_permission' ? 'No' :
          kitchen_code || 'No'
    };

    // เพิ่ม password เฉพาะเมื่อมีการส่งมา
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    await userModel.update(
      updateData,
      { where: { user_code } }
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

// exports.login = async (req, res) => {
//   try {
//     const { username, password } = req.body;

//     // Find user with permissions included
//     const user = await userModel.findOne({
//       where: { username },
//       include: [
//         {
//           model: db.Tbl_typeuserpermission,
//           required: false
//         },
//         {
//           model: Tbl_TypeuserModel,
//           required: false
//         }
//       ]
//     });

//     // Verify user exists and password matches
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid username or password"
//       });
//     }

//     // If user doesn't have LINE UID, return special response
//     if (!user.line_uid) {
//       return res.json({
//         success: true,
//         requireLineLogin: true,
//         tempUserData: {
//           user_code: user.user_code,
//           username: user.username
//         }
//       });
//     }

//     // User has LINE UID, generate token and return success
//     const token = jwt.sign(
//       { username: user.username },
//       process.env.ENCRYPT_TOKEN_KEY,
//       { algorithm: 'HS256', expiresIn: '24h' }
//     );

//     res.json({
//       success: true,
//       data: user,
//       tokenKey: token,
//       userData2: user
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };

// Update LINE UID for user
exports.updateLineUID = async (req, res) => {
  try {
    const { user_code, line_uid } = req.body;

    const user = await userModel.findOne({
      where: { user_code },
      include: [
        {
          model: db.Tbl_typeuserpermission,
          required: false
        },
        {
          model: Tbl_TypeuserModel,
          required: false
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update LINE UID
    await userModel.update(
      { line_uid },
      { where: { user_code } }
    );

    // Get updated user data
    const updatedUser = await userModel.findOne({
      where: { user_code },
      include: [
        {
          model: db.Tbl_typeuserpermission,
          required: false
        },
        {
          model: Tbl_TypeuserModel,
          required: false
        }
      ]
    });

    // Generate token
    const token = jwt.sign(
      { username: updatedUser.username },
      process.env.ENCRYPT_TOKEN_KEY,
      { algorithm: 'HS256', expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: updatedUser,
      tokenKey: token,
      userData2: updatedUser
    });

  } catch (error) {
    console.error('Update LINE UID Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating LINE UID'
    });
  }
};

exports.lineCallback = async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://api.line.me/oauth2/v2.1/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: "https://weerainventory.com/liff",
        client_id: '2006891227',
        client_secret: '39009903d743bdd0eec0ab1a7637a087'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const { access_token } = tokenResponse.data;

    // Get LINE profile
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });

    const lineProfile = profileResponse.data;

    res.json({
      success: true,
      line_uid: lineProfile.userId
    });

  } catch (error) {
    console.error('LINE Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย LINE',
      error: error.message
    });
  }
};

exports.checkLineUID = async (req, res) => {
  try {
    const { line_uid } = req.body;

    const user = await userModel.findOne({
      where: { line_uid },
      include: [
        {
          model: db.Tbl_typeuserpermission,
          required: false
        },
        {
          model: Tbl_TypeuserModel,
          required: false
        }
      ]
    });

    if (user) {
      const token = jwt.sign(
        { username: user.username },
        process.env.ENCRYPT_TOKEN_KEY,
        { algorithm: 'HS256', expiresIn: '24h' }
      );

      res.json({
        exists: true,
        token,
        userData: user,
        userData2: user  // เพิ่ม userData2
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking LINE UID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
