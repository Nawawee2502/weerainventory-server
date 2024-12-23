const Wh_product_lotnoModel = require("../models/mainModel").Wh_product_lotno;
const { Tbl_product, Tbl_unit } = require("../models/mainModel")
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addWh_product_lotno = async (req, res) => {
  try {
    Wh_product_lotnoModel.create({
      product_code: req.body.product_code,
      lotno: req.body.lotno,
      unit_code: req.body.unit_code,
      qty: req.body.qty,
      uprice: req.body.uprice,
      refno: req.body.refno,
      qty_use: req.body.qty_use,
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};



exports.updatewh_product_lotno = async (req, res) => {
  try {
    Wh_product_lotnoModel.update(
      {
        unit_code: req.body.unit_code,
        qty: req.body.qty,
        uprice: req.body.uprice,
        qty_use: req.body.qty_use
      },
      {
        where: {
          refno: req.body.refno,
          lotno: req.body.lotno,
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


exports.deletewh_product_lotno = async (req, res) => {
  try {
    Wh_product_lotnoModel.destroy(
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code,
        }
      }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Query_wh_product_lotno = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { product_code } = req.body;


    const wh_product_lotnoShow = await Wh_product_lotnoModel.findAll({
      where: {
        product_code: product_code
      },
      include: [
        {
          model: Tbl_product,
          attributes: ['product_code', 'product_name'],
          required: false
        },
        {
          model: Tbl_unit,
          attributes: ['unit_code', 'unit_name'],
          required: false
        }
      ],
      order: [['lotno', 'ASC']],
    });

    res.status(200).send({ result: true, data: wh_product_lotnoShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};



