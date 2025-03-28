const Kt_trwdtModel = require("../models/mainModel").Kt_trwdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const productModel = require("../models/mainModel").Tbl_product;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.addKt_trwdt = async (req, res) => {
  try {
    Kt_trwdtModel.create({
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
    // console.log("API SERVER");
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.updateKt_trwdt = async (req, res) => {
  // console.log("reg.body ===>",req.body);
  try {
    Kt_trwdtModel.update(
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
    // console.log("update=>",wh_posdtModel)
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteKt_trwdt = async (req, res) => {
  try {
    Kt_trwdtModel.destroy(
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

exports.Kt_trwdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Kt_trwdtShow = await Kt_trwdtModel.findAll({ offset: offset, limit: limit });
    res.status(200).send({ result: true, data: Kt_trwdtShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countKt_trwdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await Kt_trwdtModel.count({
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

exports.Kt_trwdtAlljoindt = async (req, res) => {
  try {
    const refno = req.body.refno || req.params.refno;

    if (!refno) {
      return res.status(400).json({
        result: false,
        message: 'Refno is required'
      });
    }

    console.log('Searching for details with refno:', refno);

    const Kt_trwdtShow = await Kt_trwdtModel.findAll({
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

    // Transform data to match expected format
    const transformedData = Kt_trwdtShow.map(item => {
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
    console.error('Error in Kt_trwdtAlljoindt:', error);
    res.status(500).json({
      result: false,
      message: error.message,
      error: error
    });
  }
};

