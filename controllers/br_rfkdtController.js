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
    const transformedData = br_rfkdtShow.map(item => {
      const plainItem = item.get({ plain: true });
      return {
        ...plainItem,
        product_name: plainItem.tbl_product?.product_name || '',
        product_code: plainItem.product_code,
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
    console.error('Error in Br_rfkdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};