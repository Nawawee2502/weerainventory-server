const Br_powdtModel = require("../models/mainModel").Br_powdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addBr_powdt = async (req, res) => {
  try {
    Br_powdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      amt: req.body.amt,
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateBr_powdt = async (req, res) => {
  try {
    Br_powdtModel.update(
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
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.deleteBr_powdt = async (req, res) => {
  try {
    Br_powdtModel.destroy(
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

exports.Br_powdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const br_powShow = await Br_powdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: br_powShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countBr_powdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Br_powdtModel.count({
      where: {
        refno: {
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

exports.Br_powdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_powdtShow = await Br_powdtModel.findAll({
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

    // Transform the data to include all necessary product information
    const transformedData = br_powdtShow.map(item => {
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
    console.error('Error in Br_powdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};