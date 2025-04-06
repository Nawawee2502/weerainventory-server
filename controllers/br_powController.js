const {
  Br_pow: Br_powModel,
  Br_powdt: Br_powdtModel,
  Tbl_unit: unitModel,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Br_stockcard,
  Br_product_lotno
} = require("../models/mainModel");
const { Op } = require("sequelize");


exports.addBr_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;
    console.log("headerData", headerData);

    if (!headerData.refno || !headerData.branch_code) {
      throw new Error('Missing required fields');
    }

    try {
      await Br_powModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        supplier_code: headerData.supplier_code,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      console.log("Create details:", productArrayData);
      await Br_powdtModel.bulkCreate(productArrayData, { transaction: t });

      for (const item of productArrayData) {
        const stockcardRecords = await Br_stockcard.findAll({
          where: {
            product_code: item.product_code,
            branch_code: headerData.branch_code
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

        await Br_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
          branch_code: headerData.branch_code,
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

exports.updateBr_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Br_powModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        supplier_code: updateData.supplier_code,
        branch_code: updateData.branch_code,
        taxable: updateData.taxable || 0,
        nontaxable: updateData.nontaxable || 0,
        total: updateData.total || 0,
        user_code: updateData.user_code,
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await Br_powdtModel.destroy({
      where: { refno: updateData.refno },
      transaction: t
    });

    console.log("Deleted existing details, now inserting new products:",
      updateData.productArrayData ? updateData.productArrayData.length : "No products array");

    // Insert new detail records
    if (updateData.productArrayData && updateData.productArrayData.length > 0) {
      await Br_powdtModel.bulkCreate(updateData.productArrayData, {
        transaction: t
      });

      // Also update related stock card records
      await Br_stockcard.update(
        {
          rdate: updateData.rdate,
          trdate: updateData.trdate,
          myear: updateData.myear,
          monthh: updateData.monthh
        },
        {
          where: { refno: updateData.refno },
          transaction: t
        }
      );

      // For each product in the update, update or create a stockcard entry
      for (const item of updateData.productArrayData) {
        const productCode = item.product_code;
        const qty = parseFloat(item.qty) || 0;
        const unitPrice = parseFloat(item.uprice) || 0;
        const amt = parseFloat(item.amt) || 0;

        // Find existing stock card record for this product in this order
        const existingStockcard = await Br_stockcard.findOne({
          where: {
            refno: updateData.refno,
            product_code: productCode
          },
          transaction: t
        });

        if (existingStockcard) {
          // Update existing stock card
          await Br_stockcard.update({
            unit_code: item.unit_code,
            out1: qty,
            uprice: unitPrice,
            out1_amt: amt,
            rdate: updateData.rdate,
            trdate: updateData.trdate,
            myear: updateData.myear,
            monthh: updateData.monthh
          }, {
            where: {
              refno: updateData.refno,
              product_code: productCode
            },
            transaction: t
          });
        } else {
          // Get previous balances from other stock cards
          const stockcardRecords = await Br_stockcard.findAll({
            where: {
              product_code: productCode,
              branch_code: updateData.branch_code
            },
            order: [['rdate', 'DESC'], ['refno', 'DESC']],
            raw: true,
            transaction: t
          });

          // Calculate totals from existing records
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

          const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
          const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

          // Create new stock card entry for this product
          await Br_stockcard.create({
            myear: updateData.myear,
            monthh: updateData.monthh,
            product_code: productCode,
            unit_code: item.unit_code,
            refno: updateData.refno,
            branch_code: updateData.branch_code,
            rdate: updateData.rdate,
            trdate: updateData.trdate,
            lotno: 0,
            beg1: 0,
            in1: 0,
            out1: qty,  // POW decreases stock
            upd1: 0,
            uprice: unitPrice,
            beg1_amt: 0,
            in1_amt: 0,
            out1_amt: amt,
            upd1_amt: 0,
            balance: previousBalance - qty,  // Subtract for POW
            balance_amount: previousBalanceAmount - amt
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Updated successfully',
      updatedRows: updateResult[0]
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

exports.deleteBr_pow = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Br_powdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Br_powModel.destroy({
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

exports.Br_powAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    let wheresupplier = { supplier_name: { [Op.like]: '%' } };
    if (supplier_name) {
      wheresupplier = { supplier_name: { [Op.like]: `%${supplier_name}%` } };
    }

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_powShow = await Br_powModel.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          where: wheresupplier,
          required: true,
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          where: wherebranch,
          required: true,
        }
      ],
      where: {
        trdate: { [Op.between]: [rdate1, rdate2] }
      },
      attributes: {
        include: [
          'balance',
          'balance_amount'
        ]
      }
    });

    res.status(200).send({
      result: true,
      data: br_powShow
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_powAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, supplier_code, branch_code, product_code } = req.body;
    const { refno } = req.body; // Added to handle single refno lookup
    const { Op } = require("sequelize");

    let whereClause = {};

    // If refno is provided, use that as the primary filter
    if (refno) {
      whereClause.refno = refno;
    } else {
      // Otherwise use the date range filters
      if (rdate) whereClause.rdate = rdate;
      if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
      if (supplier_code) whereClause.supplier_code = supplier_code;
      if (branch_code) whereClause.branch_code = branch_code;
    }

    // Only run the count query if we're doing a date range search (not a specific refno)
    let totalCount = 0;
    if (!refno && rdate1 && rdate2) {
      // Create a proper query with replacements array
      const totalResult = await sequelize.query(
        'SELECT COUNT(refno) as count FROM br_pow WHERE trdate BETWEEN ? AND ?',
        {
          replacements: [rdate1, rdate2],
          type: sequelize.QueryTypes.SELECT
        }
      );

      totalCount = totalResult[0].count;
    }

    // Fetch the header data without joining details
    const br_pow_headers = await Br_powModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
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
      limit: refno ? null : (parseInt(limit) || 10) // Don't limit if looking up by refno
    });

    res.status(200).send({
      result: true,
      data: br_pow_headers,
      total: refno ? br_pow_headers.length : totalCount
    });

  } catch (error) {
    console.error("Error in Br_powAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_powByRefno = async (req, res) => {
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

    // ดึงข้อมูลหลักก่อน
    const br_powHeader = await Br_powModel.findOne({
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name', 'addr1', 'addr2', 'tel1'],
          required: false
        },
        {
          model: Tbl_supplier,
          required: false
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: { refno: refnoValue }
    });

    if (!br_powHeader) {
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลคำสั่งซื้อ'
      });
    }

    // ดึงข้อมูลรายการสินค้าแยกต่างหาก
    const br_powDetails = await Br_powdtModel.findAll({
      include: [
        {
          model: Tbl_product,
          include: [
            {
              model: unitModel,
              as: 'productUnit1',
              required: false,
            },
            {
              model: unitModel,
              as: 'productUnit2',
              required: false,
            }
          ],
          required: false
        },
        {
          model: unitModel,
          required: false,
        }
      ],
      where: { refno: refnoValue }
    });

    console.log(`พบรายการสินค้าทั้งหมด ${br_powDetails.length} รายการ`);

    // ผสมข้อมูลเข้าด้วยกัน
    const result = br_powHeader.toJSON();
    result.br_powdts = br_powDetails;

    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Br_powByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลคำสั่งซื้อได้'
    });
  }
};

exports.countBr_pow = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await Br_powModel.count({
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

exports.searchBr_powrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const br_powShow = await Br_powModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        }
      }
    });

    res.status(200).send({ result: true, data: br_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_powrefno = async (req, res) => {
  try {
    const { branch_code, supplier_code, date } = req.body;

    if (!branch_code) {
      throw new Error('Branch code is required');
    }

    // Parse the date and format it as YYMM
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}`;

    // Create the pattern for searching - เอา supplier_code ออก
    const pattern = `BRPOW${branch_code}${dateStr}%`;

    // Find the latest reference number for this branch and month
    const refno = await Br_powModel.findOne({
      where: {
        refno: {
          [Op.like]: pattern
        },
        branch_code: branch_code
      },
      order: [['refno', 'DESC']],
    });

    // If no existing refno found, start with 001
    if (!refno) {
      const newRefno = `BRPOW${branch_code}${dateStr}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // Extract and increment the running number
    const currentRunNo = parseInt(refno.refno.slice(-3));
    const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
    const newRefno = `BRPOW${branch_code}${dateStr}${nextRunNo}`;

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

exports.searchBr_powRunno = async (req, res) => {
  try {
    const br_powShow = await Br_powModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']]
    });

    res.status(200).send({ result: true, data: br_powShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.getPowByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // ดึงข้อมูลเฉพาะรายการที่ต้องการ
    const orderData = await Br_powModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
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

exports.checkPowStatusForEdit = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // 1. ตรวจสอบว่า refno นี้มีอยู่ใน wh_dpb.refno1 หรือไม่
    const wh_dpbRecord = await sequelize.models.wh_dpb.findOne({
      where: { refno1: refno }
    });

    // ถ้าไม่มีการใช้ใน wh_dpb.refno1 แสดงว่ายังไม่ได้มีการเบิกจากคลังไปร้านอาหาร สามารถแก้ไขได้
    if (!wh_dpbRecord) {
      return res.status(200).send({
        result: true,
        canEdit: true,
        message: 'This PO has not been dispatched yet, can be edited.'
      });
    }

    // 2. ตรวจสอบสถานะของ PO นี้ว่าเป็น 'end' หรือไม่
    const poRecord = await sequelize.models.br_pow.findOne({
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

exports.checkPOUsedInDispatch = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // ตรวจสอบว่า refno นี้มีอยู่ใน wh_dpb.refno1 หรือไม่
    const wh_dpbRecord = await sequelize.models.wh_dpb.findOne({
      where: { refno1: refno }
    });

    // ถ้าไม่มีในตาราง wh_dpb.refno1 แสดงว่ายังไม่มีการเบิก สามารถแก้ไขได้
    const canEdit = !wh_dpbRecord;

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