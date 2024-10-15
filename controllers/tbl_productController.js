const tbl_productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer")
const fs = require("fs")
const formidable = require('formidable');
const path = require('path');
// const upload = multer({ dest: 'uploads/' });

// กำหนดที่เก็บไฟล์และชื่อไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadFolder = path.join(__dirname, 'upload');
    // ตรวจสอบและสร้างโฟลเดอร์หากยังไม่มี
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    cb(null, uploadFolder);  // เก็บไฟล์ในโฟลเดอร์ 'upload'
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname); // ตั้งชื่อไฟล์ใหม่
  }
});

// ตัวกรองไฟล์ เพื่ออนุญาตเฉพาะไฟล์รูปภาพ
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดเฉพาะไฟล์รูปภาพเท่านั้น'), false);
  }
};

// กำหนดขนาดไฟล์สูงสุด (2MB ในตัวอย่างนี้)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// exports.addproduct = async (req, res) => {
//   try {
//     tbl_productModel.create({
//       product_img: req.body.product_img,
//       product_code: req.body.product_code,
//       product_name: req.body.product_name,
//       typeproduct_code: req.body.typeproduct_code,
//       bulk_unit_code: req.body.bulk_unit_code,
//       bulk_unit_price: req.body.bulk_unit_price,
//       retail_unit_code: req.body.retail_unit_code,
//       retail_unit_price: req.body.retail_unit_price,
//       unit_conversion_factor: req.body.unit_conversion_factor,
//     })
//     const uploadDir = 'uploads/';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir);
//     }
//     const storage = multer.diskStorage({
//       destination: function (req, file, cb) {
//         cb(null, 'uploads/'); 
//       },
//       filename: function (req, file, cb) {
//         cb(null, Date.now() + path.extname("product_img" + req.body.product_code)); 
//       }
//     });
//     const upload = multer({ storage: storage });
//     upload.single(req.body.product_img)
//     console.log('##############')
//     console.log(req.body.product_img)
//     res.status(200).send({ result: true })

//   } catch (error) {
//     console.log(error)
//     res.status(500).send({ message: error })
//   }
// };

exports.addproduct = async (req, res) => {
  try {
    tbl_productModel.create({
      product_img: req.body.product_img,
      product_code: req.body.product_code,
      product_name: req.body.product_name,
      typeproduct_code: req.body.typeproduct_code,
      bulk_unit_code: req.body.bulk_unit_code,
      bulk_unit_price: req.body.bulk_unit_price,
      retail_unit_code: req.body.retail_unit_code,
      retail_unit_price: req.body.retail_unit_price,
      unit_conversion_factor: req.body.unit_conversion_factor,
    })
    console.log("%%%%%%%%%%%%%%%%%%%%%%%%");
    console.log(req.file);
    // if (!req.file) {
    //   res.status(400).send('No file uploaded.');
    // }

    // upload.single('product_img')(req, res, (err) => {
    //   // if (err instanceof multer.MulterError) {
    //   //   // กรณีมีข้อผิดพลาดจาก multer เช่น ขนาดไฟล์เกิน
    //   //   return res.status(400).send(`เกิดข้อผิดพลาดจาก Multer: ${err.message}`);
    //   // } else if (err) {
    //   //   // กรณีมีข้อผิดพลาดอื่นๆ เช่น ไม่ใช่ไฟล์รูปภาพ
    //   //   return res.status(400).send(`เกิดข้อผิดพลาด: ${err.message}`);
    //   // }

    //   // // หากไม่มีข้อผิดพลาดและอัปโหลดสำเร็จ
    //   // if (!req.file) {
    //   //   return res.status(400).send('ไม่พบไฟล์ที่ถูกอัปโหลด');
    //   // }

    //   // res.send(`อัปโหลดไฟล์สำเร็จ: ${req.file.filename}`);
    // });

    // // เขียนไฟล์
    // // fs.writeFile(filePath, content, (err) => {
    // //   if (err) {
    // //     console.error('เกิดข้อผิดพลาดในการบันทึกไฟล์:', err);
    // //   } else {
    // //     console.log('บันทึกไฟล์สำเร็จ:', filePath);
    // //   }
    // // });
    // console.log('##############')
    // console.log(req.body.product_img)
    res.status(200).send({ result: true })

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateproduct = async (req, res) => {
  try {
    tbl_productModel.update(
      {
        product_img: req.body.product_img,
        product_name: req.body.product_name,
        bulk_unit_code: req.body.bulk_unit_code,
        bulk_unit_price: req.body.bulk_unit_price,
        retail_unit_code: req.body.retail_unit_code,
        retail_unit_price: req.body.retail_unit_price,
        unit_conversion_factor: req.body.unit_conversion_factor,
        typeproduct_code: req.body.typeproduct_code,
      },
      { where: { product_code: req.body.product_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteproduct = async (req, res) => {
  try {
    tbl_productModel.destroy(
      { where: { product_code: req.body.product_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.productAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const productShow = await tbl_productModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: productShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.productcode = async (req, res) => {
  try {
    const productcode = await tbl_productModel.findOne({
      order: [['product_code', 'DESC']],
    });
    res.status(200).send({ result: true, data: productcode })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.countProduct = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_productModel.count({
      where: {
        product_code: {
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

exports.searchProductName = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { product_name } = await req.body;
    // console.log((typeproduct_name));


    const productShow = await tbl_productModel.findAll({
      where: {
        product_name: {
          [Op.like]: `%${product_name}%`
        },
      }
    });
    res.status(200).send({ result: true, data: productShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};
