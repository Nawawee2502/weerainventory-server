const Kt_rfwdtModel = require("../models/mainModel").Kt_rfwdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_rfwdt = async (req, res) => {
  try {
    Kt_rfwdtModel.create({
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
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateKt_rfwdt = async (req, res) => {
  try {
    Kt_rfwdtModel.update(
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

exports.deleteKt_rfwdt = async (req, res) => {
  try {
    Kt_rfwdtModel.destroy(
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

exports.Kt_rfwdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Kt_rfwdtShow = await Kt_rfwdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Kt_rfwdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countKt_rfwdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_rfwdtModel.count({
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

exports.Kt_rfwdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const kt_rfwdtShow = await Kt_rfwdtModel.findAll({
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
    const transformedData = kt_rfwdtShow.map(item => {
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
    console.error('Error in Kt_rfwdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};