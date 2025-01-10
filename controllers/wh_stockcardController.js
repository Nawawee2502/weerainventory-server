const Wh_stockcardModel = require("../models/mainModel").Wh_stockcard;
const Wh_product_lotnoModel = require("../models/mainModel").Wh_product_lotno;
const { Tbl_product, Tbl_unit } = require("../models/mainModel");
const { sequelize } = require("../models/mainModel");


exports.addWh_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Incoming request body:", req.body);

    // Check for existing record
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

    // Calculate balance and balance_amount
    const balance = (Number(req.body.beg1) || 0) +
      (Number(req.body.in1) || 0) -
      (Number(req.body.out1) || 0) +
      (Number(req.body.upd1) || 0);

    const balance_amount = balance * (Number(req.body.uprice) || 0);

    // Create stockcard record with balance fields
    const stockcardRecord = await Wh_stockcardModel.create({
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
      balance: balance,
      balance_amount: balance_amount
    }, { transaction: t });

    console.log("Created stockcard record:", stockcardRecord);

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Created successfully'
    });

  } catch (error) {
    await t.rollback();
    console.log("Error in addWh_stockcard:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateWh_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Update Request Body:", req.body);

    // Calculate new balance and balance_amount
    const balance = (Number(req.body.beg1) || 0) +
      (Number(req.body.in1) || 0) -
      (Number(req.body.out1) || 0) +
      (Number(req.body.upd1) || 0);

    const balance_amount = balance * (Number(req.body.uprice) || 0);

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
        upd1_amt: req.body.upd1_amt,
        balance: balance,
        balance_amount: balance_amount
      },
      {
        where: {
          refno: req.body.refno,
          myear: req.body.myear,
          monthh: req.body.monthh,
          product_code: req.body.product_code,
          rdate: req.body.rdate,
          trdate: req.body.trdate
        },
        transaction: t
      }
    );

    if (updateResult[0] === 0) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "No record found to update"
      });
    }

    await t.commit();
    res.status(200).send({
      result: true,
      updatedRows: updateResult[0]
    });

  } catch (error) {
    await t.rollback();
    console.log("Update Error:", error);
    res.status(500).send({ message: error.message });
  }
};



exports.deleteWh_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // หา record ที่จะลบจาก stockcard ก่อน
    const stockcardRecord = await Wh_stockcardModel.findOne({
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code
      },
      transaction: t
    });

    if (!stockcardRecord) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "Record not found"
      });
    }

    // ลบข้อมูลใน stockcard
    await Wh_stockcardModel.destroy({
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code
      },
      transaction: t
    });

    // ลบข้อมูลใน product lotno โดยใช้ rdate จาก stockcard record
    await Wh_product_lotnoModel.destroy({
      where: {
        refno: req.body.refno,
        product_code: req.body.product_code,
        rdate: stockcardRecord.rdate
      },
      transaction: t
    });

    await t.commit();
    res.status(200).send({ result: true });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};


exports.Query_Wh_stockcard = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, product_code, product_name, trdate, refno } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    } else if (rdate) {
      whereClause.rdate = rdate;
    }

    if (product_code) {
      whereClause.product_code = product_code;
    }

    let productWhereClause = {};
    if (product_name) {
      productWhereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    const stockcardShow = await Wh_stockcardModel.findAll({
      where: whereClause,
      include: [
        {
          model: Tbl_product,
          attributes: ['product_code', 'product_name'],
          required: true,
          where: Object.keys(productWhereClause).length > 0 ? productWhereClause : undefined
        },
        {
          model: Tbl_unit,
          attributes: ['unit_code', 'unit_name'],
          required: false
        }
      ],
      order: [
        ['trdate', 'ASC'],
        ['refno', 'ASC']
      ],
      offset: offset,
      limit: limit
    });

    res.status(200).send({
      result: true,
      data: stockcardShow
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
    const { rdate, trdate, product_name, refno } = req.body;  // เพิ่ม trdate และ refno
    const { Op } = require("sequelize");

    let whereClause = {};
    if (rdate) {
      whereClause.rdate = rdate;
    }
    if (trdate) {  // เพิ่มเงื่อนไข trdate
      whereClause.trdate = trdate;
    }
    if (refno) {   // เพิ่มเงื่อนไข refno
      whereClause.refno = refno;
    }

    const countOptions = {
      where: whereClause
    };

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

    const amount = await Wh_stockcardModel.count(countOptions);
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log("Error in countWh_stockcard:", error);
    res.status(500).send({ message: error.message });
  }
};