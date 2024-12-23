const Wh_stockcardModel = require("../models/mainModel").Wh_stockcard;
const Wh_product_lotnoModel = require("../models/mainModel").Wh_product_lotno;
const { Tbl_product, Tbl_unit } = require("../models/mainModel");
const { sequelize } = require("../models/mainModel");


exports.addWh_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // Check for existing record with same product_code and dates
    const existingRecord = await Wh_stockcardModel.findOne({
      where: {
        product_code: req.body.product_code,
        rdate: req.body.rdate,
        trdate: req.body.trdate
      },
      transaction: t
    });

    if (existingRecord) {
      await t.rollback();
      return res.status(400).send({
        result: false,
        message: `This product has already been added on ${req.body.rdate}`,
        type: 'DUPLICATE_RECORD'
      });
    }

    // 1. Create stockcard record
    await Wh_stockcardModel.create({
      myear: req.body.myear,
      monthh: req.body.monthh,
      product_code: req.body.product_code,
      unit_code: req.body.unit_code,
      refno: req.body.refno,
      rdate: req.body.rdate,
      trdate: req.body.trdate,
      beg1: req.body.beg1,
      in1: req.body.in1,
      out1: req.body.out1,
      upd1: req.body.upd1,
      uprice: req.body.uprice,
      beg1_amt: req.body.beg1_amt,
      in1_amt: req.body.in1_amt,
      out1_amt: req.body.out1_amt,
      upd1_amt: req.body.upd1_amt,
    }, { transaction: t });

    // 2. Get current lotno from product
    const product = await Tbl_product.findOne({
      where: { product_code: req.body.product_code },
      attributes: ['lotno'],
      transaction: t
    });

    const newLotno = (product?.lotno || 0) + 1;

    // 3. Create product lotno record
    await Wh_product_lotnoModel.create({
      product_code: req.body.product_code,
      lotno: newLotno,
      unit_code: req.body.unit_code,
      qty: req.body.beg1_amt || 0,
      uprice: req.body.uprice,
      refno: req.body.refno,
      qty_use: 0.00
    }, { transaction: t });

    // 4. Update lotno in product table
    await Tbl_product.update(
      { lotno: newLotno },
      {
        where: { product_code: req.body.product_code },
        transaction: t
      }
    );

    await t.commit();
    res.status(200).send({ result: true });
  } catch (error) {
    await t.rollback();
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};
exports.updateWh_stockcard = async (req, res) => {
  try {
    // Log request body
    console.log("Update Request Body:", req.body);

    const updateResult = await Wh_stockcardModel.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        product_code: req.body.product_code,
        unit_code: req.body.unit_code,
        beg1: req.body.beg1,
        in1: req.body.in1,
        out1: req.body.out1,
        upd1: req.body.upd1,
        uprice: req.body.uprice,
        beg1_amt: req.body.beg1_amt,
        in1_amt: req.body.in1_amt,
        out1_amt: req.body.out1_amt,
        upd1_amt: req.body.upd1_amt
      },
      {
        where: {
          refno: req.body.refno,
          myear: req.body.myear,
          monthh: req.body.monthh,
          product_code: req.body.product_code
        },
        returning: true // เพิ่มบรรทัดนี้เพื่อดูผลการอัพเดต
      }
    );

    // Log update result
    console.log("Update Result:", updateResult);

    // ตรวจสอบว่ามีการอัพเดตจริงๆ
    if (updateResult[0] === 0) {
      return res.status(404).send({
        result: false,
        message: "No record found to update"
      });
    }

    res.status(200).send({ result: true, updatedRows: updateResult[0] });
  } catch (error) {
    console.log("Update Error:", error);
    res.status(500).send({ message: error.message });
  }
};


exports.deleteWh_stockcard = async (req, res) => {
  try {
    await Wh_stockcardModel.destroy({
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code
      }
    });
    res.status(200).send({ result: true });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};


exports.Query_Wh_stockcard = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { product_code, rdate, product_name } = req.body;
    const { Op } = require("sequelize");

    // Create base where clause
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    // Add product code condition if provided
    if (product_code) {
      whereClause.product_code = product_code;
    }


    const Wh_stockcardShow = await Wh_stockcardModel.findAll({
      where: whereClause,
      include: [
        {
          model: Tbl_product,
          attributes: ['product_code', 'product_name'],
          required: true, // Changed to true for inner join
          where: product_name ? {
            product_name: {
              [Op.like]: `%${product_name}%`
            }
          } : undefined
        },
        {
          model: Tbl_unit,
          attributes: ['unit_code', 'unit_name'],
          required: false
        }
      ],
      order: [['refno', 'ASC']],
      offset: offset,
      limit: limit
    });

    res.status(200).send({
      result: true,
      data: Wh_stockcardShow
    });
  } catch (error) {
    console.log("Error in Query_Wh_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.countWh_stockcard = async (req, res) => {
  try {
    const { rdate, product_name } = req.body;
    const { Op } = require("sequelize");

    // สร้าง where clause สำหรับการนับ
    let whereClause = {};

    // เพิ่มเงื่อนไขวันที่ถ้ามี
    if (rdate) {
      whereClause.rdate = rdate;
    }

    const countOptions = {
      where: whereClause
    };

    // เพิ่มเงื่อนไขค้นหาตามชื่อสินค้าถ้ามี
    if (product_name) {
      countOptions.include = [{
        model: Tbl_product,
        attributes: ['product_code', 'product_name'],
        where: {
          product_name: {
            [Op.like]: `%${product_name}%`
          }
        },
        required: true
      }];
    }

    // นับจำนวนตามเงื่อนไขที่กำหนด
    const amount = await Wh_stockcardModel.count(countOptions);

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log("Error in countWh_stockcard:", error);
    res.status(500).send({ message: error.message });
  }
};


