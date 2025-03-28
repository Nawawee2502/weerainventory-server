const Br_grfdtModel = require("../models/mainModel").Br_grfdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addBr_grfdt = async (req, res) => {
  try {
    Br_grfdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      amt: req.body.amt,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
    })
    // console.log("API SERVER");
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateBr_grfdt = async (req, res) => {
  // console.log("reg.body ===>",req.body);
  try {
    Br_grfdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
        unit_code: req.body.unit_code,
        amt: req.body.amt,
        expire_date: req.body.expire_date,
        texpire_date: req.body.texpire_date,
      },
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );
    // console.log("update=>",wh_posdtModel)
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteBr_grfdt = async (req, res) => {
  try {
    Br_grfdtModel.destroy(
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Br_grfdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Br_grfdtShow = await Br_grfdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Br_grfdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_grfdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Br_grfdtModel.count({
      where: {
        refno: {
          [Op.eq]: req.body.refno
        },
      },
    });
    res.status(200).send({ result: true, data: amount })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// Fix for the br_grfdtController.js - exports.Br_grfdtAlljoindt function

exports.Br_grfdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    // Additional validation
    if (!refno) {
      return res.status(400).send({
        result: false,
        message: "Missing required parameter: refno"
      });
    }

    console.log(`Processing Br_grfdtAlljoindt request for refno: ${refno}`);

    const br_grfdtShow = await Br_grfdtModel.findAll({
      include: [
        {
          model: productModel,
          required: true,
          include: [
            {
              model: unitModel,
              as: 'productUnit1',
              required: false
            },
            {
              model: unitModel,
              as: 'productUnit2',
              required: false
            }
          ]
        },
        {
          model: unitModel,
          required: false
        }
      ],
      where: { refno: refno },
      order: [['product_code', 'ASC']]
    });

    console.log(`Found ${br_grfdtShow.length} detail records for refno: ${refno}`);

    // Transform the data to include all necessary product information
    const transformedData = br_grfdtShow.map(item => {
      const plainItem = item.get({ plain: true });
      return {
        ...plainItem,
        product_name: plainItem.tbl_product?.product_name || '',
        product_code: plainItem.product_code || '',
        bulk_unit_price: plainItem.tbl_product?.bulk_unit_price || 0,
        retail_unit_price: plainItem.tbl_product?.retail_unit_price || 0,
        unit_name: plainItem.tbl_unit?.unit_name || '',
        productUnit1: plainItem.tbl_product?.productUnit1 || null,
        productUnit2: plainItem.tbl_product?.productUnit2 || null
      };
    });

    res.status(200).send({
      result: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Error in Br_grfdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};

