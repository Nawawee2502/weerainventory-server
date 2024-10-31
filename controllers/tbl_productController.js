const tbl_productModel = require("../models/mainModel").Tbl_product;
const tbl_TypeproductModel = require("../models/mainModel").Tbl_typeproduct;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer")
const fs = require("fs")
const formidable = require('formidable');
const path = require('path');
const tbl_unit = require("../models/mainModel").Tbl_unit;
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

exports.productAlltypeproduct = async (req, res) => {
  try {
    const { offset, limit } = req.body; // รับค่า offset และ limit

    const productShow = await tbl_productModel.findAll({
      offset: offset,  // กำหนด offset
      limit: limit,    // กำหนด limit
      include: [
        {
          model: tbl_TypeproductModel,
        },
        {
          model: tbl_unit,
          as: 'productUnit1',
        }, 
        {
          model: tbl_unit,
          as: 'productUnit2',
        }, 
      ],
    });
    res.status(200).send({ result: true, data: productShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.SearchProductCode = async (req, res) => {
  try {
    const { product_code } = req.body;
    const { Op } = require("sequelize");


    // Post.find({ where: { ...}, include: [User]})
    const productShow = await tbl_productModel.findAll({
      include: [
        {
          model: tbl_TypeproductModel,
          required: true,
        },
        {
          model: tbl_unit,
          as: 'productUnit1',
          required: true,
        },
        {
          model: tbl_unit,
          as: 'productUnit2',
          required: true,
        },
      ],
      where: { product_code: { [Op.eq]: product_code } },
      // where: { trdate: {[Op.between]: [rdate1,rdate2]}},
    });
    console.log(productShow)
    res.status(200).send({ result: true, data: productShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.productcode = async (req, res) => {
  try {
    const { Op } = require("sequelize");  // เพิ่มบรรทัดนี้
    
    // ดึงข้อมูลทั้งหมดแล้วส่งไปให้ UI คำนวณ
    const allProducts = await tbl_productModel.findAll({
      attributes: ['product_code'],
      where: {
        product_code: {
          [Op.not]: null
        }
      },
      order: [['product_code', 'DESC']]
    });

    res.status(200).send({ 
      result: true, 
      data: allProducts 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ 
      result: false,
      message: error.message || 'An error occurred while fetching product codes'
    });
  }
};

exports.countProduct = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_productModel.count({
      include: [
        {
          model: tbl_TypeproductModel,
        },
        {
          model: tbl_unit,
          as: 'productUnit1',
        },
        {
          model: tbl_unit,
          as: 'productUnit2',
        },
      ],
      where: {
        product_code: {
          [Op.gt]: '0', // เปลี่ยนจาก 0 เป็น '0' เพราะ product_code อาจเป็น string
        },
      },
      distinct: true,  // เพิ่ม distinct เพื่อป้องกันการนับซ้ำจากการ join
      col: 'product_code'  // ระบุคอลัมน์ที่ต้องการนับ
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
      include: [
        {
          model: tbl_TypeproductModel,
          required: true,
        },
        {
          model: tbl_unit,
          as: 'productUnit1',
          required: true,
        },
        {
          model: tbl_unit,
          as: 'productUnit2',
          required: true,
        },
      ],
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
