const Br_rfwdtModel = require("../models/mainModel").Br_rfwdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addBr_rfwdt = async (req, res) => {
  try {
    Br_rfwdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      amt: req.body.amt,
    })
    // console.log("API SERVER");
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateBr_rfwdt = async (req, res) => {
  // console.log("reg.body ===>",req.body);
  try {
    Br_rfwdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        unit_code: req.body.unit_code,
        amt: req.body.amt,
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


exports.deleteBr_rfwdt = async (req, res) => {
  try {
    Br_rfwdtModel.destroy(
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

exports.Br_rfwdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Br_rfwdtShow = await Br_rfwdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Br_rfwdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_rfwdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Br_rfwdtModel.count({
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

exports.Br_rfwdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfwdtShow = await Br_rfwdtModel.findAll({
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

    // Transform the data
    const transformedData = br_rfwdtShow.map(item => {
      const plainItem = item.get({ plain: true });
      return {
        ...plainItem,
        product_name: plainItem.tbl_product?.product_name || '',
        product_code: plainItem.tbl_product?.product_code || '',
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
    console.error('Error in Br_rfwdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};

