const {
  Kt_rfw: Kt_rfwModel,
  Kt_rfwdt: Kt_rfwdtModel,
  Kt_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  User,
  Tbl_unit: unitModel,
  Kt_product_lotno
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // Create header record - note: no supplier_code in this model
      await Kt_rfwModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable || 0,
        nontaxable: footerData.nontaxable || 0,
        total: footerData.total || 0
      }, { transaction: t });

      // Create detail records
      await Kt_rfwdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty),
          unit_code: item.unit_code,
          uprice: Number(item.uprice),
          tax1: item.tax1,
          amt: Number(item.amt),
          expire_date: item.expire_date || null,
          texpire_date: item.texpire_date || null,
          temperature1: item.temperature1 || null
        })),
        { transaction: t }
      );

      // Update stockcard
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

        const qty = Number(item.qty || 0);
        const uprice = Number(item.uprice || 0);
        const amount = qty * uprice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;


        // const product = await Tbl_product.findOne({
        //   where: { product_code: item.product_code },
        //   attributes: ['lotno'],
        //   transaction: t
        // });

        // const newLotno = (product?.lotno || 0) + 1;

        // await Kt_product_lotno.create({
        //   product_code: item.product_code,
        //   lotno: newLotno,
        //   unit_code: item.unit_code,
        //   qty: previousBalance + qty,
        //   lotdate: headerData.rdate,
        //   tlotdate: headerData.trdate,
        //   refno: headerData.refno,
        //   expdate: item.expire_date || null,
        //   texpdate: item.texpire_date || null,
        //   created_at: new Date(),
        //   updated_at: new Date()
        // }, { transaction: t });

        // await Tbl_product.update(
        //   { lotno: newLotno },
        //   {
        //     where: { product_code: item.product_code },
        //     transaction: t
        //   }
        // );
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

exports.updateKt_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Kt_rfwModel.update(
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
    await Kt_rfwdtModel.destroy({
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
        Kt_rfwdtModel.upsert(product, {
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

exports.deleteKt_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    // Delete detail records first
    await Kt_rfwdtModel.destroy({
      where: { refno },
      transaction: t
    });

    // Delete stockcard records
    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    // Delete product lotno records
    await Kt_product_lotno.destroy({
      where: { refno },
      transaction: t
    });

    // Finally delete main record
    const deleteResult = await Kt_rfwModel.destroy({
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

exports.Kt_rfwAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const kt_rfwShow = await Kt_rfwModel.findAll({
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

    });

    res.status(200).send({
      result: true,
      data: kt_rfwShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_rfwAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;
    console.log("API Request:", req.body);

    // ขั้นตอนที่ 1: ดึงข้อมูล header ด้วยเงื่อนไขการค้นหา
    let whereHeaders = {};

    if (rdate1 && rdate2) {
      whereHeaders.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereHeaders.kitchen_code = kitchen_code;
    }

    // ทำการค้นหา header เอกสาร
    const headers = await Kt_rfwModel.findAll({
      where: whereHeaders,
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
      raw: true,
      nest: true
    });

    console.log(`Found ${headers.length} headers`);

    if (headers.length === 0) {
      return res.status(200).send({
        result: true,
        data: [],
        total: 0
      });
    }

    // ขั้นตอนที่ 2: ดึงข้อมูล details จาก headers ที่พบ
    const refnos = headers.map(h => h.refno);

    let whereDetails = {
      refno: { [Op.in]: refnos }
    };

    // เพิ่มเงื่อนไขการค้นหาด้วย product_code (ถ้ามี)
    if (product_code && product_code !== '') {
      whereDetails.product_code = product_code;
    }

    const details = await Kt_rfwdtModel.findAll({
      where: whereDetails,
      include: [
        {
          model: Tbl_product,
          attributes: ['product_code', 'product_name'],
          required: false
        },
        {
          model: unitModel,
          attributes: ['unit_code', 'unit_name'],
          required: false
        }
      ],
      raw: true,
      nest: true
    });

    console.log(`Found ${details.length} details`);

    // ขั้นตอนที่ 3: รวมข้อมูล header และ detail เข้าด้วยกัน
    const headerMap = {};
    headers.forEach(header => {
      headerMap[header.refno] = header;
    });

    const flattenedData = details.map(detail => ({
      date: formatDateForDisplay(headerMap[detail.refno]?.rdate),
      refno: detail.refno,
      kitchen: headerMap[detail.refno]?.tbl_kitchen?.kitchen_name,
      product_id: detail.product_code,
      product_name: detail.tbl_product?.product_name,
      quantity: detail.qty,
      unit_price: detail.uprice,
      expireDate: formatDateForDisplay(detail.expiry_date),
      unit_code: detail.tbl_unit?.unit_name,
      amount: detail.amt,
      total: headerMap[detail.refno]?.total,
      user_code: headerMap[detail.refno]?.user?.username
    }));

    console.log(`Returning ${flattenedData.length} flattened records`);

    return res.status(200).send({
      result: true,
      data: flattenedData,
      total: flattenedData.length
    });

  } catch (error) {
    console.error("Error in Kt_rfwAlljoindt:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

// ฟังก์ชันช่วยจัดรูปแบบวันที่
function formatDateForDisplay(dateStr) {
  if (!dateStr) return null;

  try {
    // รองรับหลายรูปแบบของวันที่
    let date;
    if (dateStr.length === 8) { // Format: YYYYMMDD
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      date = `${month}/${day}/${year}`;
    } else {
      // กรณีอื่นๆ ให้ใช้วันที่ต้นฉบับ
      date = dateStr;
    }

    return date;
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateStr;
  }
}

exports.Kt_rfwByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับจากคลังเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    const kt_rfwShow = await Kt_rfwModel.findOne({
      include: [
        {
          model: Kt_rfwdtModel,
          include: [{
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
              },
            ],
          }],
        },
        {
          model: Tbl_kitchen,
          required: false
        }
      ],
      where: { refno: refnoValue.toString() }
    });

    if (!kt_rfwShow) {
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับจากคลัง'
      });
    }

    res.status(200).json({ result: true, data: kt_rfwShow });
  } catch (error) {
    console.error('Error in Kt_rfwByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับจากคลังได้'
    });
  }
};

exports.countKt_rfw = async (req, res) => {
  try {
    const { rdate } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {
      refno: {
        [Op.gt]: 0,
      }
    };

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await Kt_rfwModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_rfwrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const kt_rfwShow = await Kt_rfwModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: kt_rfwShow });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.Kt_rfwrefno = async (req, res) => {
  try {
    const { month, year } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (month && year) {
      const pattern = `KTRFW${year}${month}%`;
      whereClause.refno = { [Op.like]: pattern };
    }

    const refno = await Kt_rfwModel.findOne({
      where: whereClause,
      order: [['refno', 'DESC']],
    });

    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_rfwRunno = async (req, res) => {
  try {
    const kt_rfwShow = await Kt_rfwModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: kt_rfwShow });

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.getUsedRefnosKt_rfw = async (req, res) => {
  try {
    // Get all records from kt_rfw table
    const usedReceipts = await Kt_rfwModel.findAll({
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

exports.getKtRfwByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Kt_rfwModel.findOne({
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
    console.error("Error in getRfwByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};