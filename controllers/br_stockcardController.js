const Br_stockcardModel = require("../models/mainModel").Br_stockcard;
const { Tbl_product, Tbl_unit, Tbl_branch } = require("../models/mainModel");
const { sequelize } = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Incoming request body:", req.body);

    if (!req.body.product_code || !req.body.rdate || !req.body.trdate || !req.body.branch_code) {
      throw new Error('Missing required fields: product_code, rdate, trdate, or branch_code');
    }

    try {
      const existingRecord = await Br_stockcardModel.findOne({
        where: {
          product_code: req.body.product_code,
          refno: req.body.refno,
          rdate: req.body.rdate,
          branch_code: req.body.branch_code
        },
        transaction: t
      });

      if (existingRecord) {
        await t.rollback();
        return res.status(400).send({
          result: false,
          message: `This product has already been added for ${req.body.rdate} with reference ${req.body.refno} in this branch`,
          type: 'DUPLICATE_RECORD'
        });
      }

      const stockcardRecords = await Br_stockcardModel.findAll({
        where: { product_code: req.body.product_code },
        order: [
          ['trdate', 'ASC'],
          ['refno', 'ASC']
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

      const newBeg1 = Number(req.body.beg1 || 0);
      const newIn1 = Number(req.body.in1 || 0);
      const newOut1 = Number(req.body.out1 || 0);
      const newUpd1 = Number(req.body.upd1 || 0);
      const newPrice = Number(req.body.uprice || 0);

      const beg1_amt = newBeg1 * newPrice;
      const in1_amt = newIn1 * newPrice;
      const out1_amt = newOut1 * newPrice;
      const upd1_amt = newUpd1 * newPrice;

      const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
      const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

      const currentTransactionBalance = newBeg1 + newIn1 + newUpd1 - newOut1;
      const currentTransactionAmount = beg1_amt + in1_amt + upd1_amt - out1_amt;

      const finalBalance = previousBalance + currentTransactionBalance;
      const finalBalanceAmount = previousBalanceAmount + currentTransactionAmount;

      const stockcardRecord = await Br_stockcardModel.create({
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code,
        unit_code: req.body.unit_code,
        branch_code: req.body.branch_code,
        refno: req.body.refno,
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        lotno: req.body.lotno || 0,
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
    console.error("Error in addBr_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message,
      errorDetail: error.stack
    });
  }
};

exports.updateBr_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    console.log("Update Request Body:", req.body);

    // ตรวจสอบว่ามีข้อมูลจำเป็นครบถ้วนหรือไม่
    if (!req.body.refno || !req.body.myear || !req.body.monthh || !req.body.product_code || !req.body.branch_code || !req.body.rdate) {
      await t.rollback();
      return res.status(400).send({
        result: false,
        message: 'Missing required fields: refno, myear, monthh, product_code, branch_code, or rdate'
      });
    }

    // หาข้อมูลเดิมก่อนอัปเดต โดยใช้เงื่อนไขที่ครบถ้วน
    const originalRecord = await Br_stockcardModel.findOne({
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code,
        branch_code: req.body.branch_code,
        rdate: req.body.rdate
      },
      transaction: t
    });

    if (!originalRecord) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "Original record not found"
      });
    }

    // ตรวจสอบว่ามีข้อมูลซ้ำหรือไม่ - ถ้ามีการเปลี่ยนวันที่หรือร้านอาหาร
    if (req.body.rdate !== originalRecord.rdate || req.body.branch_code !== originalRecord.branch_code) {
      const duplicateCheck = await Br_stockcardModel.findOne({
        where: {
          product_code: req.body.product_code,
          rdate: req.body.rdate,
          branch_code: req.body.branch_code,
          refno: req.body.refno,
          [Op.not]: {
            myear: req.body.myear,
            monthh: req.body.monthh
          }
        },
        transaction: t
      });

      if (duplicateCheck) {
        await t.rollback();
        return res.status(400).send({
          result: false,
          message: `This product has already been added for ${req.body.rdate} with reference ${req.body.refno} in this branch`,
          type: 'DUPLICATE_RECORD'
        });
      }
    }

    // Calculate new values
    const newBeg1 = Number(req.body.beg1 || 0);
    const newIn1 = Number(req.body.in1 || 0);
    const newOut1 = Number(req.body.out1 || 0);
    const newUpd1 = Number(req.body.upd1 || 0);
    const newPrice = Number(req.body.uprice || 0);

    // Calculate amounts
    const beg1_amt = newBeg1 * newPrice;
    const in1_amt = newIn1 * newPrice;
    const out1_amt = newOut1 * newPrice;
    const upd1_amt = newUpd1 * newPrice;

    // Calculate balance - เฉพาะรายการนี้
    const currentTransactionBalance = newBeg1 + newIn1 + newUpd1 - newOut1;
    const currentTransactionAmount = beg1_amt + in1_amt + upd1_amt - out1_amt;

    // ใช้เงื่อนไขที่เฉพาะเจาะจงมากขึ้นในการอัปเดต
    // ต้องระบุทั้ง refno, myear, monthh, product_code, branch_code, และ rdate
    const updateResult = await Br_stockcardModel.update({
      trdate: req.body.trdate,
      unit_code: req.body.unit_code,
      lotno: req.body.lotno || 0,
      beg1: newBeg1,
      in1: newIn1,
      out1: newOut1,
      upd1: newUpd1,
      uprice: newPrice,
      beg1_amt: beg1_amt,
      in1_amt: in1_amt,
      out1_amt: out1_amt,
      upd1_amt: upd1_amt,
      balance: currentTransactionBalance,
      balance_amount: currentTransactionAmount
    }, {
      where: {
        refno: req.body.refno,
        myear: req.body.myear,
        monthh: req.body.monthh,
        product_code: req.body.product_code,
        branch_code: req.body.branch_code,
        rdate: req.body.rdate  // เพิ่ม rdate เข้าไปในเงื่อนไข
      },
      transaction: t
    });

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
      message: 'Updated successfully',
      updatedRows: updateResult[0]
    });

  } catch (error) {
    await t.rollback();
    console.error("Update Error:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.deleteBr_stockcard = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // ตรวจสอบว่ามีข้อมูลจำเป็นครบถ้วนหรือไม่
    if (!req.body.refno || !req.body.myear || !req.body.monthh || !req.body.product_code) {
      await t.rollback();
      return res.status(400).send({
        result: false,
        message: 'Missing required fields: refno, myear, monthh, or product_code'
      });
    }

    // สร้างเงื่อนไขพื้นฐาน
    let whereClause = {
      refno: req.body.refno,
      myear: req.body.myear,
      monthh: req.body.monthh,
      product_code: req.body.product_code
    };

    // เพิ่มเงื่อนไขเพิ่มเติม
    if (req.body.branch_code) {
      whereClause.branch_code = req.body.branch_code;
    }

    if (req.body.rdate) {
      whereClause.rdate = req.body.rdate;
    }

    // ค้นหารายการที่จะลบ
    const recordsToDelete = await Br_stockcardModel.findAll({
      where: whereClause,
      transaction: t
    });

    if (recordsToDelete.length === 0) {
      await t.rollback();
      return res.status(404).send({
        result: false,
        message: "No records found to delete"
      });
    }

    // แสดงจำนวนรายการที่จะลบในประวัติการทำงาน
    console.log(`Found ${recordsToDelete.length} records to delete with criteria:`, whereClause);

    // ลบตามเงื่อนไขที่ระบุ
    const deleteResult = await Br_stockcardModel.destroy({
      where: whereClause,
      transaction: t
    });

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Deleted successfully',
      deletedCount: deleteResult
    });
  } catch (error) {
    await t.rollback();
    console.error("Error in deleteBr_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_stockcardAll = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, product_code, product_name, branch_code, branch_name, refno } = req.body;

    console.log("Received request parameters:", req.body);

    let whereClause = {};

    // Handle date filtering
    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    } else if (rdate) {
      whereClause.rdate = rdate;
    }

    // Apply filters
    if (product_code) {
      whereClause.product_code = product_code;
    }

    if (branch_code) {
      whereClause.branch_code = branch_code;
    }

    // Add refno filter if provided
    if (refno) {
      whereClause.refno = refno;
    }

    let productWhereClause = {};
    if (product_name) {
      productWhereClause.product_name = {
        [Op.like]: `%${product_name}%`
      };
    }

    let branchWhereClause = {};
    if (branch_name) {
      branchWhereClause.branch_name = {
        [Op.like]: `%${branch_name}%`
      };
    }

    console.log("SQL where clause:", JSON.stringify(whereClause));

    const stockcardShow = await Br_stockcardModel.findAll({
      attributes: [
        'product_code',
        'unit_code',
        'branch_code',
        'refno',
        'rdate',
        'trdate',
        'lotno',
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
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false,
          where: Object.keys(branchWhereClause).length > 0 ? branchWhereClause : undefined
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

    console.log(`Found ${stockcardShow.length} records`);

    // Important: Add display IDs without expecting them to be in database
    const transformedData = stockcardShow.map((item, index) => ({
      ...item.get({ plain: true }),
      display_id: (offset || 0) + index + 1  // Change from 'id' to 'display_id'
    }));

    res.status(200).send({
      result: true,
      data: transformedData
    });

  } catch (error) {
    console.error("Error in Br_stockcardAll:", error);
    res.status(500).send({
      result: false,
      message: error.message || "An error occurred while fetching stockcard data"
    });
  }
};


exports.countBr_stockcard = async (req, res) => {
  try {
    const { rdate, rdate1, rdate2, product_code, product_name, branch_code, refno } = req.body;

    console.log("Count request parameters:", req.body);

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    } else if (rdate) {
      whereClause.rdate = rdate;
    }

    if (product_code) {
      whereClause.product_code = product_code;
    }

    if (branch_code) {
      whereClause.branch_code = branch_code;
    }

    if (refno) {
      whereClause.refno = refno;
    }

    console.log("Count where clause:", whereClause);

    const countOptions = {
      where: whereClause,
      col: 'product_code'
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

    // ใช้ count แบบปกติแทนที่จะนับ ID field
    const count = await Br_stockcardModel.count(countOptions);

    console.log("Count result:", count);

    res.status(200).send({
      result: true,
      data: count
    });

  } catch (error) {
    console.error("Error in countBr_stockcard:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};