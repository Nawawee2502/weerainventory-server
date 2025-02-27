const Kt_grfdtModel = require("../models/mainModel").Kt_grfdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

exports.addKt_grfdt = async (req, res) => {
  try {
    Kt_grfdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      amt: req.body.amt,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
      temperature1: req.body.temperature1,
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateKt_grfdt = async (req, res) => {
  try {
    Kt_grfdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
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
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.deleteKt_grfdt = async (req, res) => {
  try {
    Kt_grfdtModel.destroy(
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

exports.Kt_grfdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Kt_grfdtShow = await Kt_grfdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Kt_grfdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countKt_grfdt = async (req, res) => {
  try {
    const amount = await Kt_grfdtModel.count({
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

exports.Kt_grfdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const kt_grfdtShow = await Kt_grfdtModel.findAll({
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
    const transformedData = kt_grfdtShow.map(item => {
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
    console.error('Error in Kt_grfdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};