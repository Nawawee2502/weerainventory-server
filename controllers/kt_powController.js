const {
  Kt_pow: Kt_powModel,
  Kt_powdt: Kt_powdtModel,
  Tbl_unit: unitModel,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  User,
  Kt_stockcard,
  Kt_product_lotno
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;
    console.log("headerData", headerData);

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields');
    }

    try {
      // Create with 'active' status for new POs
      await Kt_powModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total,
        status: 'working' // Add status field
      }, { transaction: t });

      console.log("Create details:", productArrayData);
      await Kt_powdtModel.bulkCreate(productArrayData, { transaction: t });

      for (const item of productArrayData) {
        const stockcardRecords = await Kt_stockcard.findAll({
          where: {
            product_code: item.product_code,
            kitchen_code: headerData.kitchen_code
          },
          order: [['rdate', 'DESC'], ['refno', 'DESC']],
          raw: true,
          transaction: t
        });

        const totals = stockcardRecords.reduce((acc, record) => ({
          beg1: acc.beg1 + Number(record.beg1 || 0),
          in1: acc.in1 + Number(record.in1 || 0),
          out1: acc.out1 + Number(record.out1 || 0),
          upd1: acc.upd1 + Number(record.upd1 || 0),
          beg1_amt: acc.beg1_amt + Number(record.beg1_amt || 0),
          in1_amt: acc.in1_amt + Number(record.in1_amt || 0),
          out1_amt: acc.out1_amt + Number(record.out1_amt || 0),
          upd1_amt: acc.upd1_amt + Number(record.upd1_amt || 0)
        }), {
          beg1: 0, in1: 0, out1: 0, upd1: 0,
          beg1_amt: 0, in1_amt: 0, out1_amt: 0, upd1_amt: 0
        });

        const newAmount = Number(item.qty || 0);
        const newPrice = Number(item.uprice || 0);
        const newAmountValue = newAmount * newPrice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        await Kt_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
          kitchen_code: headerData.kitchen_code,
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          lotno: 0,
          beg1: 0,
          in1: 0,
          out1: newAmount,  // POW decreases stock
          upd1: 0,
          uprice: newPrice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: newAmountValue,
          upd1_amt: 0,
          balance: previousBalance - newAmount,  // Subtract for POW
          balance_amount: previousBalanceAmount - newAmountValue
        }, { transaction: t });

        const product = await Tbl_product.findOne({
          where: { product_code: item.product_code },
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (product?.lotno || 0) + 1;

        await Tbl_product.update(
          { lotno: newLotno },
          {
            where: { product_code: item.product_code },
            transaction: t
          }
        );
      }

      await t.commit();
      res.status(200).send({ result: true });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;
    console.log("updateKt_pow - request body:", JSON.stringify(req.body, null, 2));

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields');
    }

    // Step 1: Update header data
    await Kt_powModel.update(
      {
        rdate: headerData.rdate,
        trdate: headerData.trdate,
        myear: headerData.myear,
        monthh: headerData.monthh,
        kitchen_code: headerData.kitchen_code,
        taxable: headerData.taxable || 0,
        nontaxable: headerData.nontaxable || 0,
        total: footerData?.total || headerData.total || 0,
        user_code: headerData.user_code,
        // Don't update status here as it might have been modified by dispatches
      },
      {
        where: { refno: headerData.refno },
        transaction: t
      }
    );

    // Step 2: Delete all existing detail records for this refno
    await Kt_powdtModel.destroy({
      where: { refno: headerData.refno },
      transaction: t
    });

    // Step 3: Insert new detail records
    if (productArrayData && productArrayData.length > 0) {
      await Kt_powdtModel.bulkCreate(productArrayData, { transaction: t });
    }

    // Step 4: Update related stockcard records
    await Kt_stockcard.update(
      {
        rdate: headerData.rdate,
        trdate: headerData.trdate,
        myear: headerData.myear,
        monthh: headerData.monthh
      },
      {
        where: { refno: headerData.refno },
        transaction: t
      }
    );

    // Step 5: Recalculate balance
    if (productArrayData && productArrayData.length > 0) {
      // Calculate new balance
      const balance = productArrayData.reduce((sum, item) =>
        sum - parseFloat(item.qty || 0), 0); // Negative for POW

      const balance_amount = productArrayData.reduce((sum, item) => {
        const qty = parseFloat(item.qty || 0);
        const uprice = parseFloat(item.uprice || 0);
        return sum - (qty * uprice); // Negative for POW
      }, 0);

      // Update balance in header
      await Kt_powModel.update(
        {
          balance: balance,
          balance_amount: balance_amount
        },
        {
          where: { refno: headerData.refno },
          transaction: t
        }
      );
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Updated successfully',
      data: {
        refno: headerData.refno,
        itemCount: productArrayData ? productArrayData.length : 0
      }
    });

  } catch (error) {
    await t.rollback();
    console.error('Update Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.deleteKt_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Kt_powdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Kt_powModel.destroy({
      where: { refno },
      transaction: t
    });

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Deleted successfully',
      deletedRows: deleteResult
    });

  } catch (error) {
    await t.rollback();
    console.error('Delete Error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Kt_powAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const kt_powShow = await Kt_powModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        }
      ],
      where: {
        trdate: { [Op.between]: [rdate1, rdate2] }
      },
      attributes: {
        include: [
          'balance',
          'balance_amount',
          'status' // Include status in response
        ]
      }
    });

    res.status(200).send({
      result: true,
      data: kt_powShow
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_powAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate) whereClause.rdate = rdate;
    if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    if (kitchen_code) whereClause.kitchen_code = kitchen_code;

    // Only run the count query if we're doing a date range search
    let totalCount = 0;
    if (rdate1 && rdate2) {
      const totalResult = await sequelize.query(
        'SELECT COUNT(refno) as count FROM kt_pow WHERE trdate BETWEEN ? AND ?',
        {
          replacements: [rdate1, rdate2],
          type: sequelize.QueryTypes.SELECT
        }
      );
      totalCount = totalResult[0].count;
    }

    // ดึงเฉพาะข้อมูลส่วนหัว ไม่ต้อง Join กับรายละเอียด (เหมือนใน Br_powAlljoindt)
    const kt_pow_headers = await Kt_powModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at', 'status'
      ],
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset: parseInt(offset) || 0,
      limit: parseInt(limit) || 10
    });

    res.status(200).send({
      result: true,
      data: kt_pow_headers,
      total: totalCount
    });

  } catch (error) {
    console.error("Error in Kt_powAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Kt_powByRefno = async (req, res) => {
  try {
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลัก (header)
    const kt_powHeader = await Kt_powModel.findOne({
      where: { refno: refnoValue },
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false
        }
      ],
      attributes: {
        include: ['status']
      }
    });

    if (!kt_powHeader) {
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบเบิก'
      });
    }

    // ดึงข้อมูลรายการสินค้า (detail)
    const kt_powDetails = await Kt_powdtModel.findAll({
      where: { refno: refnoValue },
      include: [
        {
          model: Tbl_product,
          include: [
            {
              model: unitModel,
              as: 'productUnit1',
              required: true,
            },
            {
              model: unitModel,
              as: 'productUnit2',
              required: true,
            },
          ],
          required: true
        }
      ]
    });

    console.log(`พบรายการเบิกทั้งหมด ${kt_powDetails.length} รายการ`);

    const result = kt_powHeader.toJSON();
    result.kt_powdts = kt_powDetails;

    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Kt_powByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบเบิกได้'
    });
  }
};


exports.countKt_pow = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await Kt_powModel.count({
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

exports.searchKt_powrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const kt_powShow = await Kt_powModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        }
      }
    });

    res.status(200).send({ result: true, data: kt_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_powrefno = async (req, res) => {
  try {
    const { kitchen_code, date } = req.body;

    if (!kitchen_code) {
      throw new Error('Kitchen code is required');
    }

    // Parse the date and format it as YYMM
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}`;

    // Create the pattern for searching
    const pattern = `KTPOW${kitchen_code}${dateStr}%`;

    // Find the latest reference number for this kitchen and month
    const refno = await Kt_powModel.findOne({
      where: {
        refno: {
          [Op.like]: pattern
        },
        kitchen_code: kitchen_code
      },
      order: [['refno', 'DESC']],
    });

    // If no existing refno found, start with 001
    if (!refno) {
      const newRefno = `KTPOW${kitchen_code}${dateStr}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // Extract and increment the running number
    const currentRunNo = parseInt(refno.refno.slice(-3));
    const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
    const newRefno = `KTPOW${kitchen_code}${dateStr}${nextRunNo}`;

    res.status(200).send({
      result: true,
      data: { refno: newRefno }
    });

  } catch (error) {
    console.error('Generate refno error:', error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.searchKt_powRunno = async (req, res) => {
  try {
    const kt_powShow = await Kt_powModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']]
    });

    res.status(200).send({ result: true, data: kt_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.getKtPowByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Kt_powModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at', 'status' // Include status field
      ],
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: { refno: refno }
    });

    if (!orderData) {
      return res.status(404).send({
        result: false,
        message: 'Order not found'
      });
    }

    res.status(200).send({
      result: true,
      data: orderData
    });

  } catch (error) {
    console.error("Error in getPowByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

// Add methods for checking PO status
exports.checkKtPowStatusForEdit = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // 1. Check if refno exists in wh_dpk.refno1
    const wh_dpkRecord = await sequelize.models.wh_dpk.findOne({
      where: { refno1: refno }
    });

    // If no dispatch has been made, it can be edited
    if (!wh_dpkRecord) {
      return res.status(200).send({
        result: true,
        canEdit: true,
        message: 'This PO has not been dispatched yet, can be edited.'
      });
    }

    // 2. Check the status of this PO
    const poRecord = await Kt_powModel.findOne({
      where: { refno: refno },
      attributes: ['refno', 'status']
    });

    if (!poRecord) {
      return res.status(404).send({
        result: false,
        message: 'PO record not found'
      });
    }

    const canEdit = poRecord.status !== 'end';

    return res.status(200).send({
      result: true,
      canEdit: canEdit,
      status: poRecord.status,
      message: canEdit
        ? 'This PO can still be edited.'
        : 'This PO has been fully dispatched and cannot be edited.'
    });

  } catch (error) {
    console.error("Error checking PO status for edit:", error);
    return res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.checkKtPOUsedInDispatch = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Check if refno exists in wh_dpk.refno1
    const wh_dpkRecord = await sequelize.models.wh_dpk.findOne({
      where: { refno1: refno }
    });

    // If no dispatch has been made, it can be edited
    const canEdit = !wh_dpkRecord;

    return res.status(200).send({
      result: true,
      canEdit: canEdit,
      isUsed: !canEdit,
      message: canEdit
        ? 'This PO has not been used in dispatch yet, can be edited.'
        : 'This PO has been used in dispatch and cannot be edited.'
    });

  } catch (error) {
    console.error("Error checking PO used in dispatch:", error);
    return res.status(500).send({
      result: false,
      message: error.message
    });
  }
};