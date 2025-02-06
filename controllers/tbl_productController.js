const tbl_productModel = require("../models/mainModel").Tbl_product;
const tbl_TypeproductModel = require("../models/mainModel").Tbl_typeproduct; // เพิ่มบรรทัดนี้
const { Op } = require("sequelize"); // เพิ่มบรรทัดนี้
const multer = require("multer");
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadFolder = path.join(__dirname, '../public/images');
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
    }
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileType = file.mimetype.split('/')[1];
    cb(null, `product-${req.body.product_code}-${uniqueSuffix}.${fileType}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Please upload only image files.'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

exports.updateProductImage = async (req, res) => {
  try {
    upload.single('product_img')(req, res, async (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).send({
          result: false,
          message: err.message
        });
      }

      const { product_code } = req.body;

      // หา product เดิมเพื่อลบรูปเก่า
      const existingProduct = await tbl_productModel.findOne({
        where: { product_code }
      });

      if (existingProduct?.product_img) {
        const oldImagePath = path.join(process.cwd(), 'public/images', existingProduct.product_img);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // อัพเดทชื่อไฟล์ในฐานข้อมูล
      if (req.file) {
        await tbl_productModel.update(
          { product_img: req.file.filename },
          { where: { product_code } }
        );

        res.status(200).send({
          result: true,
          message: 'Image uploaded successfully',
          filename: req.file.filename
        });
      } else {
        res.status(400).send({
          result: false,
          message: 'No file uploaded'
        });
      }
    });
  } catch (error) {
    console.error('Controller error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.searchProductsForImage = async (req, res) => {
  try {
    const { offset = 0, limit = 10, typeproduct_code, product_name } = req.body;

    let whereClause = {};

    if (typeproduct_code) {
      whereClause.typeproduct_code = typeproduct_code;
    }

    if (product_name) {
      whereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    const products = await tbl_productModel.findAll({
      where: whereClause,
      include: [{
        model: tbl_TypeproductModel,
        required: false
      }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['product_code', 'ASC']]
    });

    const total = await tbl_productModel.count({ where: whereClause });

    res.status(200).send({
      result: true,
      data: products,
      total,
      offset,
      limit
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

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
        tax1: req.body.tax1, // เพิ่มบรรทัดนี้
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
    const { offset, limit, typeproduct_code, product_name } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (typeproduct_code) {
      whereClause.typeproduct_code = typeproduct_code;
    }

    if (product_name) {
      whereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    const productShow = await tbl_productModel.findAll({
      offset: offset,
      limit: limit,
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
      where: whereClause,
      order: [['product_code', 'ASC']]
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
    const { typeproduct_code, product_name } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (typeproduct_code) {
      whereClause.typeproduct_code = typeproduct_code;
    }

    if (product_name) {
      whereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    // เปลี่ยนการใช้ count และลบ includes ที่ไม่จำเป็น
    const amount = await tbl_productModel.count({
      where: whereClause
    });

    res.status(200).send({
      result: true,
      data: amount
    });

  } catch (error) {
    console.error('Count Product Error:', error);
    res.status(500).send({
      result: false,
      message: error.message || 'Error counting products'
    });
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

exports.searchproduct = async (req, res) => {
  try {
    const { product_name, typeproduct_code } = req.body;
    const { Op } = require("sequelize");

    // สร้าง where clause ตามเงื่อนไขที่ส่งมา
    let whereClause = {};

    if (product_name) {
      whereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    if (typeproduct_code) {
      whereClause.typeproduct_code = typeproduct_code;
    }

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
      where: whereClause,
      order: [['product_code', 'ASC']] // เพิ่มการเรียงลำดับตาม product_code
    });

    res.status(200).send({ result: true, data: productShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};