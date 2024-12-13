const {
  Br_rfsdt: br_rfsdtModel,
  Tbl_unit: unitModel,
  Tbl_product: productModel
} = require("../models/mainModel");

exports.addBr_rfsdt = async (req, res) => {
  try {
    await br_rfsdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      tax1: req.body.tax1,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
      instant_saving1: req.body.instant_saving1,
      temperature1: req.body.temperature1,
      amt: req.body.amt,
    });
    res.status(200).send({ result: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.updateBr_rfsdt = async (req, res) => {
  try {
    await br_rfsdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
        tax1: req.body.tax1,
        unit_code: req.body.unit_code,
        expire_date: req.body.expire_date,
        texpire_date: req.body.texpire_date,
        instant_saving1: req.body.instant_saving1,
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

exports.deleteBr_rfsdt = async (req, res) => {
  try {
    await br_rfsdtModel.destroy({
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

exports.Br_rfsdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const br_rfsdtShow = await br_rfsdtModel.findAll({
      offset: offset,
      limit: limit
    });
    res.status(200).send({ result: true, data: br_rfsdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.countBr_rfsdt = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await br_rfsdtModel.count({
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

exports.Br_rfsdtAlljoindt = async (req, res) => {
  try {
    const { refno } = req.body;
    const br_rfsdtShow = await br_rfsdtModel.findAll({
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
    
    res.status(200).send({ result: true, data: br_rfsdtShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};