const {
  Tbl_kitchen,
  sequelize,
  Tbl_product,
  User,
  Wh_rfk: wh_rfkModel,
  Wh_rfkdt: wh_rfkdtModel,
  Tbl_unit: unitModel,
  Wh_product_lotno,
  Wh_stockcard
} = require("../models/mainModel");

exports.addWh_rfk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. สร้าง WH_RFK record
      await wh_rfkModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable,
        nontaxable: footerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      // 2. สร้าง detail records
      await wh_rfkdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty),
          unit_code: item.unit_code,
          uprice: Number(item.uprice),
          tax1: item.tax1,
          expire_date: item.expire_date,
          texpire_date: item.texpire_date,
          temperature1: item.temperature1,
          amt: Number(item.amt)
        })),
        { transaction: t }
      );

      // 3. สร้าง stockcard records และอัพเดท lotno
      for (const item of productArrayData) {
        // หา records ทั้งหมดของสินค้านี้เพื่อคำนวณยอดรวม
        const stockcardRecords = await Wh_stockcard.findAll({
          where: { product_code: item.product_code },
          order: [
            ['rdate', 'DESC'],
            ['refno', 'DESC']
          ],
          raw: true,
          transaction: t
        });

        // คำนวณยอดรวมจาก records ที่มีอยู่
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

        // คำนวณค่าใหม่
        const newAmount = Number(item.amt || 0);
        const newPrice = Number(item.uprice || 0);
        const newAmountValue = newAmount * newPrice;

        // คำนวณ balance และ balance_amount
        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        // สร้าง stockcard record ใหม่
        await Wh_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
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

        // จัดการ lotno
        const product = await Tbl_product.findOne({
          where: { product_code: item.product_code },
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (product?.lotno || 0) + 1;

        // บันทึก product lotno
        await Wh_product_lotno.create({
          product_code: item.product_code,
          lotno: newLotno,
          unit_code: item.unit_code,
          qty: newAmount,
          uprice: newPrice,
          refno: headerData.refno,
          qty_use: 0.00,
          rdate: headerData.rdate
        }, { transaction: t });

        // อัพเดท lotno ในตาราง product
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

exports.updateWh_rfk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await wh_rfkModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
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
    await wh_rfkdtModel.destroy({
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
        wh_rfkdtModel.upsert(product, {
          transaction: t,
          // If you want to update existing records
          conflictFields: ['refno', 'product_code']
        })
      );

      await Promise.all(insertPromises);
    }

    // Update stockcard if needed
    await Wh_stockcard.update(
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

    // Update product lotno if needed
    await Wh_product_lotno.update(
      {
        rdate: updateData.rdate
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

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

exports.deleteWh_rfk = async (req, res) => {
  try {
    wh_rfkModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const Wh_rfkShow = await wh_rfkModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkAlljoindt = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { rdate1, rdate2 } = req.body;
    const { kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let wh_rfk_headers = await wh_rfkModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
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
      offset: offset,
      limit: limit
    });

    if (wh_rfk_headers.length > 0) {
      const refnos = wh_rfk_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }
        };
      }

      const details = await wh_rfkdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: unitModel,
            attributes: ['unit_code', 'unit_name'],
            required: false
          }
        ]
      });

      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail);
      });

      wh_rfk_headers = wh_rfk_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_rfkdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_rfk_headers
    });

  } catch (error) {
    console.log("Error in Wh_rfkAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_rfkByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับคืนจากครัวเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    // ดึงข้อมูลหลักของใบรับคืนจากครัว (header)
    const wh_rfkHeader = await wh_rfkModel.findOne({
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
      where: { refno: refnoValue }
    });

    if (!wh_rfkHeader) {
      console.log('ไม่พบข้อมูลใบรับคืนจากครัวเลขที่:', refnoValue);
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับคืนจากครัว'
      });
    }

    // ดึงข้อมูลรายการสินค้า (details) แยกต่างหาก
    const wh_rfkDetails = await wh_rfkdtModel.findAll({
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

    console.log(`พบรายการสินค้าทั้งหมด ${wh_rfkDetails.length} รายการในใบรับคืนจากครัวเลขที่ ${refnoValue}`);

    // แสดงข้อมูลตัวอย่างสำหรับการตรวจสอบ
    if (wh_rfkDetails.length > 0) {
      console.log('ตัวอย่างข้อมูลสินค้าชิ้นแรก:', {
        product_code: wh_rfkDetails[0].product_code,
        product_name: wh_rfkDetails[0].tbl_product?.product_name || 'ไม่มี',
        qty: wh_rfkDetails[0].qty,
        unit: wh_rfkDetails[0].tbl_unit?.unit_name || wh_rfkDetails[0].unit_code || 'ไม่มี'
      });
    }

    // แปลงข้อมูลเป็น plain objects เพื่อป้องกันปัญหา
    const result = wh_rfkHeader.toJSON();

    // ปรับแต่งข้อมูลรายการสินค้าและเติมข้อมูลที่หายไป
    const processedDetails = wh_rfkDetails.map(detail => {
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
    result.wh_rfkdts = processedDetails;

    // ส่งข้อมูลกลับ
    res.status(200).json({
      result: true,
      data: result
    });

  } catch (error) {
    console.error('Error in Wh_rfkByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับคืนจากครัวได้',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.countWh_rfk = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_rfkModel.count({
      where: {
        refno: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfkrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkrefno = async (req, res) => {
  try {
    const refno = await wh_rfkModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfkRunno = async (req, res) => {
  try {
    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getWhRfkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await wh_rfkModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
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
    console.error("Error in getRfkByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.Wh_rfkUsedRefnos = async (req, res) => {
  try {
    // Get all records from wh_rfk table without any where clause
    const usedReceipts = await wh_rfkModel.findAll({
      attributes: ['refno'],
      raw: true,
      logging: console.log // เพิ่ม logging เพื่อดู SQL query ที่ถูกสร้าง
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
      message: error.message || "Server error",
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};