const {
  Kt_prf: Kt_prfModel,
  Kt_prfdt: Kt_prfdtModel,
  Tbl_unit: unitModel,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Kt_stockcard,
  User
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_prf = async (req, res) => {
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
      await Kt_prfModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        total: footerData.total,
      }, { transaction: t });

      await Kt_prfdtModel.bulkCreate(productArrayData, { transaction: t });

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
          kitchen_code: headerData.kitchen_code,
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

exports.updateKt_prf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Kt_prfModel.update(
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
    await Kt_prfdtModel.destroy({
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
        Kt_prfdtModel.upsert(product, {
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

exports.deleteKt_prf = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Kt_prfdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Kt_prfModel.destroy({
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

exports.Kt_prfAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const kt_prfShow = await Kt_prfModel.findAll({
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
      }
    });

    res.status(200).send({
      result: true,
      data: kt_prfShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_prfAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let includes = [
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
      },
      {
        model: Kt_prfdtModel,
        required: false,
        include: [
          {
            model: unitModel,
            attributes: ['unit_code', 'unit_name'],
            required: false
          }
        ]
      }
    ];

    if (product_code) {
      includes[2].include.push({
        model: Tbl_product,
        attributes: ['product_code', 'product_name'],
        required: false,
        where: {
          product_name: { [Op.like]: `%${product_code}%` }
        }
      });
    } else {
      includes[2].include.push({
        model: Tbl_product,
        attributes: ['product_code', 'product_name'],
        required: false
      });
    }

    const kt_prf_headers = await Kt_prfModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'total', 'user_code', 'created_at'
      ],
      include: includes,
      where: whereClause,
      order: [['refno', 'ASC']],
      offset,
      limit
    });

    res.status(200).send({
      result: true,
      data: kt_prf_headers
    });

  } catch (error) {
    console.error("Error in Kt_prfAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_prfByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับเลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    const Kt_prfShow = await Kt_prfModel.findOne({
      include: [
        {
          model: Kt_prfdtModel,
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

    if (!Kt_prfShow) {
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับ'
      });
    }

    res.status(200).json({ result: true, data: Kt_prfShow });
  } catch (error) {
    console.error('Error in Kt_prfByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับได้'
    });
  }
};

exports.countKt_prf = async (req, res) => {
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

    const amount = await Kt_prfModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_prfrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Kt_prfShow = await Kt_prfModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Kt_prfShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Kt_prfrefno = async (req, res) => {
  try {
    const { kitchen_code, month, year } = req.body;

    if (!kitchen_code) {
      throw new Error('Kitchen code is required');
    }

    // สร้างรูปแบบของ refno โดยใช้ prefix 3 ตัวแรกของ kitchen_code
    const kitchenPrefix = kitchen_code.substring(0, 3).toUpperCase();

    // สร้าง pattern สำหรับค้นหา
    const pattern = `KTPRF${kitchenPrefix}${year}${month}%`;

    // ค้นหา refno ล่าสุดสำหรับครัวและเดือนนี้
    const refno = await Kt_prfModel.findOne({
      where: {
        refno: {
          [Op.like]: pattern
        },
        kitchen_code: kitchen_code
      },
      order: [['refno', 'DESC']],
    });

    // ถ้าไม่พบ refno เริ่มที่ 001
    if (!refno) {
      const newRefno = `KTPRF${kitchenPrefix}${year}${month}001`;
      res.status(200).send({
        result: true,
        data: { refno: newRefno }
      });
      return;
    }

    // ดึงและเพิ่มหมายเลขรัน
    const currentRunNo = parseInt(refno.refno.slice(-3));
    const nextRunNo = (currentRunNo + 1).toString().padStart(3, '0');
    const newRefno = `KTPRF${kitchenPrefix}${year}${month}${nextRunNo}`;

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

exports.searchKt_prfRunno = async (req, res) => {
  try {
    const Kt_prfShow = await Kt_prfModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Kt_prfShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getKtPrfByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Kt_prfModel.findOne({
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
    console.error("Error in getPrfByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};