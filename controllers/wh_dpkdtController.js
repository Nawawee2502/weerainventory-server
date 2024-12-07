const wh_dpkdtModel = require("../models/mainModel").Wh_dpkdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addWh_dpkdt = async (req, res) => {
  try {
    wh_dpkdtModel.create({
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

exports.updateWh_dpkdt = async (req, res) => {
  try {
    wh_dpkdtModel.update(
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


exports.deleteWh_dpkdt = async (req, res) => {
  try {
    wh_dpkdtModel.destroy(
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

exports.Wh_dpkdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const wh_dpkdtShow = await wh_dpkdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: wh_dpkdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_dpkdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_dpkdtModel.count({
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

exports.Wh_dpkdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_dpkdtShow = await wh_dpkdtModel.findAll({
      include: [
        {
          model: unitModel,
          required: true,
        },
        {
          model: productModel,
          required: true,
        },
      ],
      where: { refno: refno },
    });

    res.status(200).send({ result: true, data: wh_dpkdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

