const {
  Br_saf: Br_safModel,
  Br_safdt: Br_safdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Br_stockcard
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_saf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.branch_code) {
      throw new Error('Missing required fields');
    }

    try {
      await Br_safModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total
      }, { transaction: t });

      await Br_safdtModel.bulkCreate(productArrayData, { transaction: t });

      // Update stock card for each product
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
          out1: 0,
          upd1: newAmount, // Use upd1 for stock adjustments
          uprice: newPrice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: 0,
          upd1_amt: newAmountValue,
          balance: previousBalance + newAmount, // Add for adjustments
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

exports.updateBr_saf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Br_safModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        branch_code: updateData.branch_code,
        total: updateData.total || 0,
        user_code: updateData.user_code,
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await Br_safdtModel.destroy({
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
        Br_safdtModel.upsert(product, {
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

exports.deleteBr_saf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Br_safdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Br_safModel.destroy({
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

exports.Br_safAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const Br_safShow = await Br_safModel.findAll({
      include: [
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
      data: Br_safShow
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_safAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate, rdate1, rdate2, branch_code, product_code } = req.body;
    const { refno } = req.body;

    let whereClause = {};

    // If refno is provided, use that as the primary filter
    if (refno) {
      whereClause.refno = refno;
    } else {
      // Otherwise use the date range filters
      if (rdate) whereClause.rdate = rdate;
      if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
      if (branch_code) whereClause.branch_code = branch_code;
    }

    // Only run the count query if we're doing a date range search (not a specific refno)
    let totalCount = 0;
    if (!refno && rdate1 && rdate2) {
      // Create a proper query with replacements array
      const totalResult = await sequelize.query(
        'SELECT COUNT(refno) as count FROM br_saf WHERE trdate BETWEEN ? AND ?',
        {
          replacements: [rdate1, rdate2],
          type: sequelize.QueryTypes.SELECT
        }
      );

      totalCount = totalResult[0].count;
    }

    // Fetch the header data without joining details
    const br_saf_headers = await Br_safModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'total', 'user_code', 'created_at'
      ],
      include: [
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
      data: br_saf_headers,
      total: refno ? br_saf_headers.length : totalCount
    });

  } catch (error) {
    console.error("Error in Br_safAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Br_safByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบปรับปรุงสินค้าเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลักของใบปรับปรุงสินค้า (header)
    const br_safHeader = await Br_safModel.findOne({
      include: [
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

    if (!br_safHeader) {
      console.log('ไม่พบข้อมูลใบปรับปรุงสินค้าเลขที่:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบปรับปรุงสินค้า'
      });
    }

    // ดึงข้อมูลรายการสินค้า (details) แยกต่างหาก
    const br_safDetails = await Br_safdtModel.findAll({
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

    console.log(`พบรายการสินค้าทั้งหมด ${br_safDetails.length} รายการในใบปรับปรุงสินค้าเลขที่ ${refnoValue}`);

    // แสดงข้อมูลตัวอย่างสำหรับการตรวจสอบ
    if (br_safDetails.length > 0) {
      console.log('ตัวอย่างข้อมูลสินค้าชิ้นแรก:', {
        product_code: br_safDetails[0].product_code,
        product_name: br_safDetails[0].tbl_product?.product_name || 'ไม่มี',
        qty: br_safDetails[0].qty,
        unit: br_safDetails[0].tbl_unit?.unit_name || br_safDetails[0].unit_code || 'ไม่มี'
      });
    }

    // แปลงข้อมูลเป็น plain objects เพื่อป้องกันปัญหา
    const result = br_safHeader.toJSON();

    // ปรับแต่งข้อมูลรายการสินค้าและเติมข้อมูลที่หายไป
    const processedDetails = br_safDetails.map(detail => {
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
    result.br_safdts = processedDetails;

    // ส่งข้อมูลกลับ
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Br_safByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบปรับปรุงสินค้าได้',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.countBr_saf = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await Br_safModel.count({
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

exports.searchBr_safrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Br_safShow = await Br_safModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        }
      }
    });

    res.status(200).send({ result: true, data: Br_safShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_safrefno = async (req, res) => {
  try {
    const { branch_code, date } = req.body;

    if (!branch_code) {
      throw new Error('Branch code is required');
    }

    // Parse the date and format it as YYMM
    const formattedDate = new Date(date);
    const year = formattedDate.getFullYear().toString().slice(-2);
    const month = String(formattedDate.getMonth() + 1).padStart(2, '0');
    const dateStr = `${year}${month}`;

    // Create the pattern for searching
    const pattern = `BRSAF${branch_code}${dateStr}%`;

    // Find the latest reference number for this branch and month
    const refno = await Br_safModel.findOne({
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
      const newRefno = `BRSAF${branch_code}${dateStr}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // Extract and increment the running number
    const currentRunNo = parseInt(refno.refno.slice(-3));
    const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
    const newRefno = `BRSAF${branch_code}${dateStr}${nextRunNo}`;

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

exports.searchBr_safRunno = async (req, res) => {
  try {
    const Br_safShow = await Br_safModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']]
    });

    res.status(200).send({ result: true, data: Br_safShow });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: error.message });
  }
};

exports.getSafByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Br_safModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'total', 'user_code', 'created_at'
      ],
      include: [
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
    console.error("Error in getSafByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};