const {
  Wh_rfkdt: wh_rfkdtModel,
  Tbl_unit: unitModel,
  Tbl_product: productModel
} = require("../models/mainModel");

exports.addWh_rfkdt = async (req, res) => {
  try {
    await wh_rfkdtModel.create({
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
    });
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateWh_rfkdt = async (req, res) => {
  try {
    await wh_rfkdtModel.update(
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
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.deleteWh_rfkdt = async (req, res) => {
  try {
    await wh_rfkdtModel.destroy({
      where: {
        refno: req.body.refno,
        product_code: req.body.product_code
      }
    });
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.Wh_rfkdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const wh_rfkdtShow = await wh_rfkdtModel.findAll({
      offset: offset,
      limit: limit
    });
    res.status(200).send({ result: true, data: wh_rfkdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countWh_rfkdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_rfkdtModel.count({
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

exports.Wh_rfkdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;
    const wh_rfkdtShow = await wh_rfkdtModel.findAll({
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
      // offset: offset,
      // limit: limit
    });
    
    res.status(200).send({ result: true, data: wh_rfkdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};