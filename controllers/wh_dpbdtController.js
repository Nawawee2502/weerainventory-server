const wh_dpbdtModel = require("../models/mainModel").Wh_dpbdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Tbl_unit = require("../models/mainModel").Tbl_unit;
const Tbl_product = require("../models/mainModel").Tbl_product;

exports.addWh_dpbdt = async (req, res) => {
  try {
    wh_dpbdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
      temperature1: req.body.temperature1,
      amt: req.body.amt,
    })
    console.log("API SERVER");
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
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
        expire_date: req.body.expire_date,
        texpire_date: req.body.texpire_date,
        temperature1: req.body.temperature1,
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
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpbdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_dpbdtShow = await wh_dpbdtModel.findAll({
      include: [
        { model: Tbl_unit, required: true },
        { model: Tbl_product, required: true },
      ],
      where: { refno },
    });

    res.status(200).send({ result: true, data: wh_dpbdtShow });
  } catch (error) {
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
    res.status(500).send({ message: error });
  }
};