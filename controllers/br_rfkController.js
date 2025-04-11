const {
  Tbl_kitchen,
  sequelize,
  Tbl_product,
  User,
  Br_rfk: br_rfkModel,
  Br_rfkdt: br_rfkdtModel,
  Tbl_unit: unitModel,
  Br_product_lotno,
  Br_stockcard,
  Tbl_branch
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_rfk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.kitchen_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await br_rfkModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable || 0,
        nontaxable: footerData.nontaxable || 0,
        total: footerData.total || 0
      }, { transaction: t });

      await br_rfkdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty || 0),
          unit_code: item.unit_code,
          uprice: Number(item.uprice || 0),
          tax1: item.tax1,
          expire_date: item.expire_date || null,
          texpire_date: item.texpire_date || null,
          temperature1: item.temperature1 || null,
          amt: Number(item.amt || 0)
        })),
        { transaction: t }
      );

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
          in1: newAmount,
          out1: 0,
          upd1: 0,
          uprice: newPrice,
          beg1_amt: 0,
          in1_amt: newAmountValue,
          out1_amt: 0,
          upd1_amt: 0,
          balance: previousBalance + newAmount,
          balance_amount: previousBalanceAmount + newAmountValue
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
      res.status(200).json({
        result: true,
        message: 'Created successfully'
      });

    } catch (error) {
      await t.rollback();
      console.error('Transaction Error:', error);
      throw error;
    }

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'Internal server error',
      errorDetail: error.stack
    });
  }
};

exports.updateBr_rfk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await br_rfkModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
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
    await br_rfkdtModel.destroy({
      where: { refno: updateData.refno },
      transaction: t
    });

    console.log("Deleted existing details, now inserting new products:",
      updateData.productArrayData ? updateData.productArrayData.length : "No products array");

    // Insert new detail records
    if (updateData.productArrayData && updateData.productArrayData.length > 0) {
      // Add a unique constraint check and potentially modify the data
      const productsToInsert = updateData.productArrayData.map((item, index) => ({
        ...item,
        // Explicitly set the refno to ensure consistency
        refno: updateData.refno,
        // Optional: Add a unique index to prevent conflicts
        uniqueIndex: `${updateData.refno}_${index}`
      }));

      // Use upsert instead of bulkCreate to handle potential conflicts
      const insertPromises = productsToInsert.map(product =>
        br_rfkdtModel.upsert(product, {
          transaction: t,
          // If you want to update existing records
          conflictFields: ['refno', 'product_code']
        })
      );

      await Promise.all(insertPromises);
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

exports.deleteBr_rfk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await br_rfkdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await br_rfkModel.destroy({
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

exports.Br_rfkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name, branch_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_rfkShow = await br_rfkModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
      attributes: {
        include: [
          'balance',
          'balance_amount'
        ]
      }
    });

    res.status(200).send({
      result: true,
      data: br_rfkShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfkAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, branch_code, refno } = req.body;

    console.log("Br_rfkAlljoindt ได้รับ parameters:", {
      offset, limit, rdate1, rdate2, kitchen_code, branch_code, refno
    });

    let whereClause = {};

    if (refno) {
      whereClause.refno = refno;
    } else {
      if (rdate1 && rdate2) {
        whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
      }

      if (branch_code) {
        whereClause.branch_code = branch_code;
      }

      if (kitchen_code) {
        whereClause.kitchen_code = kitchen_code;
      }
    }

    console.log("WHERE clause:", JSON.stringify(whereClause));

    // ยกเลิกการใช้ pagination ให้ดึงข้อมูลทั้งหมด
    const br_rfk_headers = await br_rfkModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh', 'branch_code', 'kitchen_code', 'total',
        'user_code', 'created_at', 'updated_at', 'taxable', 'nontaxable'
      ],
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false
        },
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
      order: [['refno', 'DESC']] // เรียงจากใหม่ไปเก่า (DESC)
    });

    console.log(`พบข้อมูลทั้งหมด ${br_rfk_headers.length} รายการ`);

    res.status(200).send({
      result: true,
      data: br_rfk_headers,
      total: br_rfk_headers.length
    });
  } catch (error) {
    console.error("Error in Br_rfkAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_rfkByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับสินค้าจากครัวเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลักของใบรับสินค้าจากครัว (header)
    const br_rfkHeader = await br_rfkModel.findOne({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false
        },
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name', 'addr1', 'addr2', 'tel1'],
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

    if (!br_rfkHeader) {
      console.log('ไม่พบข้อมูลใบรับสินค้าจากครัวเลขที่:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับสินค้าจากครัว'
      });
    }

    // ดึงข้อมูลรายการสินค้า (details) แยกต่างหาก
    const br_rfkDetails = await br_rfkdtModel.findAll({
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

    console.log(`พบรายการสินค้าทั้งหมด ${br_rfkDetails.length} รายการในใบรับสินค้าจากครัวเลขที่ ${refnoValue}`);

    // แสดงข้อมูลตัวอย่างสำหรับการตรวจสอบ
    if (br_rfkDetails.length > 0) {
      console.log('ตัวอย่างข้อมูลสินค้าชิ้นแรก:', {
        product_code: br_rfkDetails[0].product_code,
        product_name: br_rfkDetails[0].tbl_product?.product_name || 'ไม่มี',
        qty: br_rfkDetails[0].qty,
        unit: br_rfkDetails[0].tbl_unit?.unit_name || br_rfkDetails[0].unit_code || 'ไม่มี'
      });
    }

    // แปลงข้อมูลเป็น plain objects เพื่อป้องกันปัญหา
    const result = br_rfkHeader.toJSON();

    // ปรับแต่งข้อมูลรายการสินค้าและเติมข้อมูลที่หายไป
    const processedDetails = br_rfkDetails.map(detail => {
      const detailObj = detail.toJSON();

      // ตรวจสอบและเติมข้อมูลที่หายไป
      if (!detailObj.tbl_product) {
        detailObj.tbl_product = { product_name: 'Product Description' };
      }

      if (!detailObj.tbl_unit) {
        detailObj.tbl_unit = { unit_name: detailObj.unit_code || '' };
      }

      return detailObj;
    });

    // เพิ่มข้อมูลรายการสินค้าเข้าไปในผลลัพธ์
    result.br_rfkdts = processedDetails;

    // ส่งข้อมูลกลับ
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Br_rfkByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับสินค้าจากครัวได้',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.countBr_rfk = async (req, res) => {
  try {
    const { rdate } = req.body;

    let whereClause = {
      refno: {
        [Op.gt]: 0,
      }
    };

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await br_rfkModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfkrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfkShow = await br_rfkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: br_rfkShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Br_rfkrefno = async (req, res) => {
  try {
    const refno = await br_rfkModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfkRunno = async (req, res) => {
  try {
    const br_rfkShow = await br_rfkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: br_rfkShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getUsedRefnos = async (req, res) => {
  try {
    // Get all records from br_rfk table - using br_rfkModel instead of br_rfk
    const usedReceipts = await br_rfkModel.findAll({
      attributes: ['refno'],
      raw: true
    });

    // Extract just the refno values into an array
    const usedRefnos = usedReceipts.map(record => record.refno);

    return res.status(200).json({
      result: true,
      data: usedRefnos
    });
  } catch (error) {
    console.error("Error fetching used refnos:", error);
    return res.status(500).json({
      result: false,
      message: error.message || "Server error"
    });
  }
};

exports.getRfkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await br_rfkModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
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
    console.error("Error in getRfkByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};