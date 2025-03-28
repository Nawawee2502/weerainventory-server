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

    // Transform the data to ensure all required fields are available
    const transformedData = br_rfsdtShow.map(item => {
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

    // Log the transformed data for debugging
    console.log("Transformed Br_rfsdtAlljoindt data:",
      transformedData.map(item => ({
        product_code: item.product_code,
        unit_name: item.unit_name,
        productUnit1: item.productUnit1 ? {
          unit_code: item.productUnit1.unit_code,
          unit_name: item.productUnit1.unit_name
        } : null
      }))
    );

    res.status(200).send({
      result: true,
      data: transformedData
    });
  } catch (error) {
    console.error('Error in Br_rfsdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};