const wh_dpbdtModel = require("../models/mainModel").Wh_dpbdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addWh_dpbdt = async (req, res) => {
  try {
    wh_dpbdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      amt: req.body.amt,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
      temperature1: req.body.temperature1,
    });
    // console.log("API SERVER");
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateWh_dpbdt = async (req, res) => {
  try {
    wh_dpbdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        unit_code: req.body.unit_code,
        amt: req.body.amt,
        expire_date: req.body.expire_date,
        texpire_date: req.body.texpire_date,
        temperature1: req.body.temperature1,
      },
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.deleteWh_dpbdt = async (req, res) => {
  try {
    wh_dpbdtModel.destroy(
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const wh_dpbdtShow = await wh_dpbdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: wh_dpbdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countWh_dpbdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_dpbdtModel.count({
      where: {
        refno: {
          [Op.eq]: req.body.refno
        },
      },
    });
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbdtAlljoindt = async (req, res) => {
  try {
    const refno = req.body.refno || req.params.refno;

    if (!refno) {
      return res.status(400).json({
        result: false,
        message: 'Refno is required'
      });
    }

    console.log('Searching for details with refno:', refno);

    const wh_dpbdtShow = await wh_dpbdtModel.findAll({
      include: [
        {
          model: unitModel,
          required: false
        },
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
        }
      ],
      where: { refno: refno.toString() },
      order: [['product_code', 'ASC']]
    });

    // Transform data format
    const transformedData = wh_dpbdtShow.map(item => {
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

    res.status(200).json({
      result: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error in Wh_dpbdtAlljoindt:', error);
    res.status(500).json({
      result: false,
      message: error.message,
      error: error
    });
  }
};