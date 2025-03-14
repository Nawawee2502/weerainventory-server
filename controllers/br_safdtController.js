const {
  Br_safdt: Br_safdtModel,
  Tbl_unit: unitModel,
  Tbl_product: productModel,
  sequelize
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_safdt = async (req, res) => {
  try {
    await Br_safdtModel.create({
      refno: req.body.refno,
      product_code: req.body.product_code,
      qty: req.body.qty,
      unit_code: req.body.unit_code,
      uprice: req.body.uprice,
      amt: req.body.amt,
      expire_date: req.body.expire_date,
      texpire_date: req.body.texpire_date,
    });
    res.status(200).send({ result: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateBr_safdt = async (req, res) => {
  try {
    const updateResult = await Br_safdtModel.update(
      {
        qty: req.body.qty,
        uprice: req.body.uprice,
        unit_code: req.body.unit_code,
        amt: req.body.amt,
        expire_date: req.body.expire_date,
        texpire_date: req.body.texpire_date,
      },
      {
        where: {
          refno: req.body.refno,
          product_code: req.body.product_code
        }
      }
    );

    res.status(200).send({
      result: true,
      message: 'Updated successfully',
      updatedRows: updateResult[0]
    });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.deleteBr_safdt = async (req, res) => {
  try {
    const deleteResult = await Br_safdtModel.destroy({
      where: {
        refno: req.body.refno,
        product_code: req.body.product_code
      }
    });

    res.status(200).send({
      result: true,
      message: 'Deleted successfully',
      deletedRows: deleteResult
    });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_safdtAllinnerjoin = async (req, res) => {
  try {
    const { offset, limit } = req.body;

    const Br_safdtShow = await Br_safdtModel.findAll({
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 10
    });

    res.status(200).send({ result: true, data: Br_safdtShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.countBr_safdt = async (req, res) => {
  try {
    const { refno } = req.body;
    let whereClause = {};

    if (refno) {
      whereClause.refno = refno;
    }

    const amount = await Br_safdtModel.count({
      where: whereClause
    });

    res.status(200).send({
      result: true,
      data: amount
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_safdtAlljoindt = async (req, res) => {
  try {
    console.log("Request body in Br_safdtAlljoindt:", req.body); // เพิ่ม log เพื่อตรวจสอบ
    const { refno } = req.body;

    if (!refno) {
      console.error("Missing refno in request:", req.body);
      return res.status(400).send({
        result: false,
        message: "refno is required",
        error: "Missing refno parameter"
      });
    }

    const Br_safdtShow = await Br_safdtModel.findAll({
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
    const transformedData = Br_safdtShow.map(item => {
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

    console.log(`Found ${transformedData.length} items for refno ${refno}`);

    res.status(200).send({
      result: true,
      data: transformedData
    });

  } catch (error) {
    console.error('Error in Br_safdtAlljoindt:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      error: error
    });
  }
};