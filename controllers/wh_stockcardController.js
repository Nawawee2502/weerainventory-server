const {
  Wh_stockcard: Wh_stockcardModel,
  Tbl_product,
  Tbl_unit
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addWh_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Incoming request body:", req.body);

    // Validate required fields
    if (!req.body.product_code || !req.body.rdate || !req.body.trdate) {
      throw new Error('Missing required fields: product_code, rdate, or trdate');
    }

    try {
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

      // Get all previous records for this product to calculate running totals
      const stockcardRecords = await Wh_stockcardModel.findAll({
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

      // Create stockcard record with calculated values
      const stockcardRecord = await Wh_stockcardModel.create({
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code,
        unit_code: req.body.unit_code,
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

      console.log("Created stockcard record:", stockcardRecord);

      // Handle product lotno if necessary
      if (newIn1 > 0) {
        const product = await Tbl_product.findOne({
          where: { product_code: req.body.product_code },
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (product?.lotno || 0) + 1;

        // Create product lotno record
        await Wh_product_lotnoModel.create({
          product_code: req.body.product_code,
          lotno: newLotno,
          unit_code: req.body.unit_code,
          qty: finalBalance,
          uprice: newPrice,
          refno: req.body.refno,
          qty_use: 0.00,
          rdate: req.body.rdate
        }, { transaction: t });

        // Update product lotno
        await Tbl_product.update(
          { lotno: newLotno },
          {
            where: { product_code: req.body.product_code },
            transaction: t
          }
        );
      }

      await t.commit();
      res.status(200).send({
        result: true,
        message: 'Created successfully',
        data: stockcardRecord
      });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error("Error in addWh_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message,
      errorDetail: error.stack
    });
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
      attributes: [
        'product_code',
        'unit_code',
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
    console.error("Error in Query_Wh_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message || "An error occurred while fetching stockcard data"
    });
  }
};

exports.countWh_stockcard = async (req, res) => {
  try {
    const { rdate, trdate, product_name, refno } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};
    if (rdate) {
      whereClause.rdate = rdate;
    }
    if (trdate) {
      whereClause.trdate = trdate;
    }
    if (refno) {
      whereClause.refno = refno;
    }

    const countOptions = {
      where: whereClause,
      distinct: true,
      col: 'refno' // หรือใช้คอลัมน์อื่นที่เหมาะสม
    };

    if (product_name) {
      countOptions.include = [{
        model: Tbl_product,
        attributes: [],  // ไม่ต้องเลือกคอลัมน์ใดๆ จาก product
        where: {
          product_name: {
            [Op.like]: `%${product_name}%`
          }
        },
        required: true
      }];
    }

    const amount = await Wh_stockcardModel.count(countOptions);

    res.status(200).send({
      result: true,
      data: amount
    });

  } catch (error) {
    console.error("Error in countWh_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message || "An error occurred while counting records"
    });
  }
};