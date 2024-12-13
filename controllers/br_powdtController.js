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
    
    res.status(200).send({ result: true, data: br_powdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};