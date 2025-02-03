const Kt_stockcardModel = require("../models/mainModel").Kt_stockcard;
const { Tbl_product, Tbl_unit, Tbl_kitchen } = require("../models/mainModel");
const { sequelize } = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // Validate required fields
    if (!req.body.product_code || !req.body.rdate || !req.body.trdate) {
      throw new Error('Missing required fields: product_code, rdate, or trdate');
    }

    // Check for existing record
    const existingRecord = await Kt_stockcardModel.findOne({
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

    // Get all previous records for this product to calculate running totals
    const stockcardRecords = await Kt_stockcardModel.findAll({
      where: { product_code: req.body.product_code },
      order: [
        ['rdate', 'DESC'],
        ['refno', 'DESC']
      ],
      raw: true,
      transaction: t
    });

    // Calculate previous totals
    const totals = stockcardRecords.reduce((acc, record) => {
      return {
        beg1: acc.beg1 + Number(record.beg1 || 0),
        in1: acc.in1 + Number(record.in1 || 0),
        out1: acc.out1 + Number(record.out1 || 0),
        upd1: acc.upd1 + Number(record.upd1 || 0),
        beg1_amt: acc.beg1_amt + Number(record.beg1_amt || 0),
        in1_amt: acc.in1_amt + Number(record.in1_amt || 0),
        out1_amt: acc.out1_amt + Number(record.out1_amt || 0),
        upd1_amt: acc.upd1_amt + Number(record.upd1_amt || 0)
      };
    }, {
      beg1: 0, in1: 0, out1: 0, upd1: 0,
      beg1_amt: 0, in1_amt: 0, out1_amt: 0, upd1_amt: 0
    });

    // Calculate new values
    const newBeg1 = Number(req.body.beg1 || 0);
    const newIn1 = Number(req.body.in1 || 0);
    const newOut1 = Number(req.body.out1 || 0);
    const newUpd1 = Number(req.body.upd1 || 0);
    const newPrice = Number(req.body.uprice || 0);

    // Calculate monetary values
    const beg1_amt = newBeg1 * newPrice;
    const in1_amt = newIn1 * newPrice;
    const out1_amt = newOut1 * newPrice;
    const upd1_amt = newUpd1 * newPrice;

    // Calculate running balances
    const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
    const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

    const currentTransactionBalance = newBeg1 + newIn1 + newUpd1 - newOut1;
    const currentTransactionAmount = beg1_amt + in1_amt + upd1_amt - out1_amt;

    const finalBalance = previousBalance + currentTransactionBalance;
    const finalBalanceAmount = previousBalanceAmount + currentTransactionAmount;

    const stockcardRecord = await Kt_stockcardModel.create({
      myear: req.body.myear,
      monthh: req.body.monthh,
      product_code: req.body.product_code,
      unit_code: req.body.unit_code,
      kitchen_code: req.body.kitchen_code,
      refno: req.body.refno,
      rdate: req.body.rdate,
      trdate: req.body.trdate,
      beg1: newBeg1,
      in1: newIn1,
      out1: newOut1,
      upd1: newUpd1,
      uprice: newPrice,
      beg1_amt: beg1_amt,
      in1_amt: in1_amt,
      out1_amt: out1_amt,
      upd1_amt: upd1_amt,
      balance: finalBalance,
      balance_amount: finalBalanceAmount
    }, { transaction: t });

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Created successfully',
      data: stockcardRecord
    });

  } catch (error) {
    await t.rollback();
    console.error("Error in addKt_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.updateKt_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // Get all previous records except current record
    const stockcardRecords = await Kt_stockcardModel.findAll({
      where: {
        product_code: req.body.product_code,
        [Op.not]: {
          refno: req.body.refno
        }
      },
      order: [
        ['rdate', 'DESC'],
        ['refno', 'DESC']
      ],
      raw: true,
      transaction: t
    });

    // Calculate totals excluding current record
    const totals = stockcardRecords.reduce((acc, record) => {
      return {
        beg1: acc.beg1 + Number(record.beg1 || 0),
        in1: acc.in1 + Number(record.in1 || 0),
        out1: acc.out1 + Number(record.out1 || 0),
        upd1: acc.upd1 + Number(record.upd1 || 0),
        beg1_amt: acc.beg1_amt + Number(record.beg1_amt || 0),
        in1_amt: acc.in1_amt + Number(record.in1_amt || 0),
        out1_amt: acc.out1_amt + Number(record.out1_amt || 0),
        upd1_amt: acc.upd1_amt + Number(record.upd1_amt || 0)
      };
    }, {
      beg1: 0, in1: 0, out1: 0, upd1: 0,
      beg1_amt: 0, in1_amt: 0, out1_amt: 0, upd1_amt: 0
    });

    // Calculate new values for current record
    const newBeg1 = Number(req.body.beg1 || 0);
    const newIn1 = Number(req.body.in1 || 0);
    const newOut1 = Number(req.body.out1 || 0);
    const newUpd1 = Number(req.body.upd1 || 0);
    const newPrice = Number(req.body.uprice || 0);

    // Calculate running balances
    const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
    const currentTransactionBalance = newBeg1 + newIn1 + newUpd1 - newOut1;
    const finalBalance = previousBalance + currentTransactionBalance;

    const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;
    const currentTransactionAmount = (newBeg1 + newIn1 + newUpd1 - newOut1) * newPrice;
    const finalBalanceAmount = previousBalanceAmount + currentTransactionAmount;

    const updateResult = await Kt_stockcardModel.update({
      rdate: req.body.rdate,
      trdate: req.body.trdate,
      kitchen_code: req.body.kitchen_code,
      unit_code: req.body.unit_code,
      beg1: newBeg1,
      in1: newIn1,
      out1: newOut1,
      upd1: newUpd1,
      uprice: newPrice,
      beg1_amt: newBeg1 * newPrice,
      in1_amt: newIn1 * newPrice,
      out1_amt: newOut1 * newPrice,
      upd1_amt: newUpd1 * newPrice,
      balance: finalBalance,
      balance_amount: finalBalanceAmount
    }, {
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code
      },
      transaction: t
    });

    if (updateResult[0] === 0) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "Record not found"
      });
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Updated successfully'
    });

  } catch (error) {
    await t.rollback();
    console.error("Error in updateKt_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.deleteKt_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const deleteResult = await Kt_stockcardModel.destroy({
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code
      },
      transaction: t
    });

    if (deleteResult === 0) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "Record not found"
      });
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Deleted successfully'
    });

  } catch (error) {
    await t.rollback();
    console.error("Error in deleteKt_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Kt_stockcardAll = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, product_code, product_name, kitchen_code, kitchen_name } = req.body;

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    } else if (rdate) {
      whereClause.rdate = rdate;
    }

    if (product_code) {
      whereClause.product_code = product_code;
    }

    if (kitchen_code) {
      whereClause.kitchen_code = kitchen_code;
    }

    let productWhereClause = {};
    if (product_name) {
      productWhereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    let kitchenWhereClause = {};
    if (kitchen_name) {
      kitchenWhereClause.kitchen_name = {
        [Op.like]: `%${kitchen_name}%`
      };
    }

    const stockcardShow = await Kt_stockcardModel.findAll({
      attributes: [
        'product_code',
        'unit_code',
        'kitchen_code',
        'refno',
        'rdate',
        'trdate',
        'beg1',
        'in1',
        'out1',
        'upd1',
        'uprice',
        'beg1_amt',
        'in1_amt',
        'out1_amt',
        'upd1_amt',
        'balance',
        'balance_amount',
        'myear',
        'monthh'
      ],
      where: whereClause,
      include: [
        {
          model: Tbl_product,
          attributes: ['product_code', 'product_name', 'typeproduct_code'],
          required: true,
          where: Object.keys(productWhereClause).length > 0 ? productWhereClause : undefined
        },
        {
          model: Tbl_unit,
          attributes: ['unit_code', 'unit_name'],
          required: false
        },
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false,
          where: Object.keys(kitchenWhereClause).length > 0 ? kitchenWhereClause : undefined
        }
      ],
      order: [
        [{ model: Tbl_product }, 'typeproduct_code', 'ASC'],
        [{ model: Tbl_product }, 'product_name', 'ASC'],
        ['trdate', 'ASC'],
        ['refno', 'ASC']
      ],
      offset: offset || 0,
      limit: limit || 10
    });

    const transformedData = stockcardShow.map((item, index) => ({
      ...item.get({ plain: true }),
      id: (offset || 0) + index + 1
    }));

    res.status(200).send({
      result: true,
      data: transformedData
    });

  } catch (error) {
    console.error("Error in Kt_stockcardAll:", error);
    res.status(500).send({
      result: false,
      message: error.message || "An error occurred while fetching stockcard data"
    });
  }
};

exports.countKt_stockcard = async (req, res) => {
  try {
    const { rdate, product_code, product_name } = req.body;

    let whereClause = {};
    if (rdate) {
      whereClause.rdate = rdate;
    }
    if (product_code) {
      whereClause.product_code = product_code;
    }

    const countOptions = {
      where: whereClause,
      distinct: true,
      col: 'refno' // Use refno instead of id since that's your primary key
    };

    if (product_name) {
      countOptions.include = [{
        model: Tbl_product,
        where: {
          product_name: {
            [Op.like]: `%${product_name}%`
          }
        },
        required: true
      }];
    }

    const count = await Kt_stockcardModel.count(countOptions);

    res.status(200).send({
      result: true,
      data: count
    });

  } catch (error) {
    console.error("Error in countKt_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};