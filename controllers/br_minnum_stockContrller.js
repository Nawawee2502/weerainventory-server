const tbl_productModel = require("../models/mainModel").Tbl_product;
const Br_minnum_stockModel = require("../models/mainModel").Br_minnum_stock;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer")
const fs = require("fs")
const formidable = require('formidable');
const { Tbl_branchModel } = require("../models/mainModel");
const tbl_unitModel = require("../models/mainModel").Tbl_unit;



exports.addBr_minnum_stock = async (req, res) => {
  try {
    Br_minnum_stockModel.create({
      product_code: req.body.product_code,
      branch_code: req.body.branch_code,
      unit_code: req.body.unit_code,
      min_qty: req.body.min_qty,
    })
    res.status(200).send({ result: true })

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateBr_minnum_stock = async (req, res) => {
  try {
    Br_minnum_stockModel.update(
      {
        unit_code: req.body.unit_code,
        min_qty: req.body.min_qty,
      },
      { where: { product_code: req.body.product_code,
            branch_code: req.body.branch_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteBr_minnum_stock = async (req, res) => {
  try {
    Br_minnum_stockModel.destroy(
      { where: { product_code: req.body.product_code ,
        branch_code: req.body.branch_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Br_minnum_stockAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const Br_minnum_stockModelShow = await Br_minnum_stockModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Br_minnum_stockModelShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Br_minnum_stockAlltypeproduct = async (req, res) => {
  try {
    const { offset, limit } = req.body; // รับค่า offset และ limit

    const Br_minnum_stockShow = await Br_minnum_stockModel.findAll({
      offset: offset,  // กำหนด offset
      limit: limit,    // กำหนด limit
      include: [
        {
          model: tbl_productModel,
        },
        {
          model: Tbl_branchModel,
        },
        {
          model: tbl_unitModel,
        },
      ],
    });
    res.status(200).send({ result: true, data: Br_minnum_stockShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.SearchBr_minnum_stock = async (req, res) => {
  try {
    const { product_code } = req.body;
    const { Op } = require("sequelize");


    // Post.find({ where: { ...}, include: [User]})
    const Br_minnum_stockShow = await Br_minnum_stockModel.findAll({
      include: [
        {
            model: tbl_productModel,
        },
        {
        model: Tbl_branchModel,
        },
        {
        model: tbl_unitModel,
        },
        
      ],
      where: { product_code: { [Op.eq]: product_code },
            branch_code: { [Op.eq]: branch_code }  },
      // where: { trdate: {[Op.between]: [rdate1,rdate2]}},
    });
    console.log(Br_minnum_stockShow)
    res.status(200).send({ result: true, data: Br_minnum_stockShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_minnum_stock = async (req, res) => {
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


