const {
  Br_rfkdt: br_rfkdtModel,
  Tbl_unit: unitModel,
  Tbl_product: productModel
} = require("../models/mainModel");

exports.addBr_rfkdt = async (req, res) => {
  try {
    await br_rfkdtModel.create({
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

exports.updateBr_rfkdt = async (req, res) => {
  try {
    await br_rfkdtModel.update(
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

exports.deleteBr_rfkdt = async (req, res) => {
  try {
    await br_rfkdtModel.destroy({
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

exports.Br_rfkdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const br_rfkdtShow = await br_rfkdtModel.findAll({
      offset: offset,
      limit: limit
    });
    res.status(200).send({ result: true, data: br_rfkdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countBr_rfkdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await br_rfkdtModel.count({
      where: {
        refno: {
          [Op.gt]: 0
        },
      },
    });
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.Br_rfkdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;
    const br_rfkdtShow = await br_rfkdtModel.findAll({
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
    
    res.status(200).send({ result: true, data: br_rfkdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};