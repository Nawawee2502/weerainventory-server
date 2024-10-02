const tbl_productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addproduct = async (req, res) => {
  try {
    tbl_productModel.create({
      product_img: req.body.product_img,
      product_code: req.body.product_code,
      product_name: req.body.product_name,
      typeproduct_code: req.body.typeproduct_code,
      bulk_unit_code: req.body.bulk_unit_code,
      bulk_unit_price: req.body.bulk_unit_price,
      retail_unit_code: req.body.retail_unit_code,
      retail_unit_price: req.body.retail_unit_price,
      unit_conversion_factor: req.body.unit_conversion_factor,
    })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.updateproduct = async (req, res) => {
  try {
    tbl_productModel.update(
      {
        product_img: req.body.product_img,
        product_name: req.body.product_name,
        bulk_unit_code: req.body.bulk_unit_code,
        bulk_unit_price: req.body.bulk_unit_price,
        retail_unit_code: req.body.retail_unit_code,
        retail_unit_price: req.body.retail_unit_price,
        unit_conversion_factor: req.body.unit_conversion_factor,
        typeproduct_code: req.body.typeproduct_code,
      },
      { where: { product_code: req.body.product_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteproduct = async (req, res) => {
  try {
    tbl_productModel.destroy(
      { where: { product_code: req.body.product_code } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.productAll = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const productShow = await tbl_productModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: productShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countProduct = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await tbl_productModel.count({
      where: {
        product_code: {
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


