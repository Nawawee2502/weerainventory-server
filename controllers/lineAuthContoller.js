const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../models/mainModel');
const User = db.User;

exports.lineCallback = async (req, res) => {
    try {
        const { code } = req.body;

        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://api.line.me/oauth2/v2.1/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
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

        // Get user profile from LINE
        const profileResponse = await axios.get('https://api.line.me/v2/profile', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const lineProfile = profileResponse.data;

        console.log( 'line_uid :', lineProfile.userId )
        console.log( 'line displayname :', lineProfile.displayName )


        // สร้างรหัสผู้ใช้ใหม่ (เช่น U0001, U0002, ...)
        const lastUser = await User.findOne({
            order: [['user_code', 'DESC']]
        });

        let newUserCode;
        if (lastUser) {
            const lastNumber = parseInt(lastUser.user_code.slice(1));
            newUserCode = `U${String(lastNumber + 1).padStart(4, '0')}`;
        } else {
            newUserCode = 'U0001';
        }

        // บันทึกข้อมูลผู้ใช้ใหม่
        const newUser = await User.create({
            user_code: newUserCode,
            username: lineProfile.displayName || '',
            password: '',
            typeuser_code: '',
            email: '',
            line_uid: lineProfile.userId,
            branch_code: '',
            kitchen_code: ''
        });

        // สร้าง token
        // const token = jwt.sign(
        //     {
        //         userId: newUser.user_code,
        //         lineUserId: lineProfile.userId
        //     },
        //     process.env.JWT_SECRET,
        //     { expiresIn: '24h' }
        // );

        // ส่งข้อมูลกลับ
        res.json({
            success: true,
            userData: {
                user_code: newUser.user_code,
                username: newUser.username,
                line_uid: newUser.line_uid
            }
        });

    } catch (error) {
        console.error('LINE Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
            error: error.message
        });
    }
};