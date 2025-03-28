const {
  Kt_trw: Kt_trwModel,
  Kt_trwdt: Kt_trwdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Kt_stockcard,
  User
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_trw = async (req, res) => {
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
      await Kt_trwModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total,
      }, { transaction: t });

      await Kt_trwdtModel.bulkCreate(productArrayData, { transaction: t });

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

        const outAmount = Number(item.qty || 0);
        const outPrice = Number(item.uprice || 0);
        const outAmountValue = outAmount * outPrice;

        const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
        const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

        await Kt_stockcard.create({
          myear: headerData.myear,
          monthh: headerData.monthh,
          product_code: item.product_code,
          kitchen_code: headerData.kitchen_code,
          unit_code: item.unit_code,
          refno: headerData.refno,
          rdate: headerData.rdate,
          trdate: headerData.trdate,
          lotno: 0,
          beg1: 0,
          in1: 0,
          out1: outAmount,
          upd1: 0,
          uprice: outPrice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: outAmountValue,
          upd1_amt: 0,
          balance: previousBalance - outAmount,
          balance_amount: previousBalanceAmount - outAmountValue
        }, { transaction: t });
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

exports.updateKt_trw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Kt_trwModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
        total: updateData.total || 0,
        user_code: updateData.user_code,
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await Kt_trwdtModel.destroy({
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
        Kt_trwdtModel.upsert(product, {
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

exports.deleteKt_trw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Kt_trwdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Kt_trwModel.destroy({
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

exports.Kt_trwAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const Kt_trwShow = await Kt_trwModel.findAll({
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

    res.status(200).send({ result: true, data: Kt_trwShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_trwAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let kt_trw_headers = await Kt_trwModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'total', 'user_code', 'created_at'
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
      offset,
      limit
    });

    if (kt_trw_headers.length > 0) {
      const refnos = kt_trw_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await Kt_trwdtModel.findAll({
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

      kt_trw_headers = kt_trw_headers.map(header => {
        const headerData = header.toJSON();
        headerData.kt_trwdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: kt_trw_headers
    });

  } catch (error) {
    console.error("Error in Kt_trwAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_trwByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_trwShow = await Kt_trwModel.findOne({
      include: [
        {
          model: Kt_trwdtModel,
          include: [{
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
          }],
        },
      ],
      where: { refno: refno }
    });
    res.status(200).send({ result: true, data: Kt_trwShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.countKt_trw = async (req, res) => {
  try {
    const amount = await Kt_trwModel.count({
      where: {
        refno: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_trwrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_trwShow = await Kt_trwModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_trwShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Kt_trwrefno = async (req, res) => {
  try {
    const { month, year, kitchen_code } = req.body;

    // บันทึกข้อมูลขาเข้าเพื่อการแก้ไขปัญหา
    console.log(`Kt_trwrefno requested with month=${month}, year=${year}, kitchen_code=${kitchen_code}, type=${typeof kitchen_code}`);

    // ตรวจสอบข้อมูลนำเข้า
    if (!month || !year) {
      return res.status(400).send({
        result: false,
        message: 'Month and year are required'
      });
    }

    if (!kitchen_code) {
      return res.status(400).send({
        result: false,
        message: 'Kitchen code is required'
      });
    }

    // แปลง kitchen_code เป็น string ให้แน่ใจว่าเราเปรียบเทียบในรูปแบบเดียวกัน
    const kitchenCodeStr = String(kitchen_code).padStart(2, '0');

    // ใช้ raw SQL query ที่มีการแปลง kitchen_code เป็น string เพื่อให้แน่ใจว่าการเปรียบเทียบถูกต้อง
    const [results] = await sequelize.query(`
      SELECT refno FROM kt_trw 
      WHERE CAST(kitchen_code AS CHAR) = ? 
      AND monthh = ? 
      AND myear = ? 
      ORDER BY CAST(SUBSTRING(refno, -3) AS UNSIGNED) DESC 
      LIMIT 1
    `, {
      replacements: [kitchenCodeStr, month, `20${year}`],
      type: sequelize.QueryTypes.SELECT
    });

    // บันทึกผลลัพธ์จาก query
    console.log(`Query results for kitchen=${kitchenCodeStr}, month=${month}, year=20${year}:`, results);

    // หากไม่พบข้อมูล ลองตรวจสอบทุกรูปแบบของ kitchen_code ที่อาจเป็นไปได้
    if (!results) {
      console.log("No results found with exact match, checking alternative formats...");

      // ตรวจสอบว่ามี kitchen_code ที่ตรงกันในรูปแบบอื่นหรือไม่
      const [allKitchenRecords] = await sequelize.query(`
        SELECT refno, kitchen_code FROM kt_trw 
        WHERE (kitchen_code = ? OR kitchen_code = ? OR CAST(kitchen_code AS CHAR) = ?) 
        AND monthh = ? 
        AND myear = ? 
        ORDER BY refno DESC
      `, {
        replacements: [kitchenCodeStr, parseInt(kitchen_code), kitchen_code, month, `20${year}`],
        type: sequelize.QueryTypes.SELECT
      });

      console.log("All possible matching kitchen records:", allKitchenRecords);
    }

    // ส่งผลลัพธ์กลับไป
    res.status(200).send({
      result: true,
      data: results,
      debug: {
        input: {
          kitchen_code: kitchen_code,
          kitchen_code_type: typeof kitchen_code,
          kitchen_code_str: kitchenCodeStr,
          month: month,
          year: year
        }
      }
    });
  } catch (error) {
    console.error('Error in Kt_trwrefno:', error);
    res.status(500).send({
      result: false,
      message: error.message,
      stack: error.stack
    });
  }
};


exports.searchKt_trwRunno = async (req, res) => {
  try {
    const Kt_trwShow = await Kt_trwModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_trwShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getKtTrwByRefno = async (req, res) => {
  try {
    // Extract refno properly handling both string and object formats
    let refnoValue = req.body.refno;

    // Handle if refno is an object (like in the error message)
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
      console.log('Extracted refno from object:', refnoValue);
    }

    console.log('Processing refno:', refnoValue, 'Type:', typeof refnoValue);

    if (!refnoValue) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Kt_trwModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'total', 'user_code', 'created_at'
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
      where: { refno: refnoValue } // Use the extracted string value
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
    console.error("Error in getTrwByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};
