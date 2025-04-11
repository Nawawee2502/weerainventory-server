const {
  Kt_rfs: Kt_rfsModel,
  Kt_rfsdt: Kt_rfsdtModel,
  Kt_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  Tbl_unit: unitModel,
  User
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addKt_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.supplier_code || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await Kt_rfsModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        supplier_code: headerData.supplier_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable || 0,
        nontaxable: footerData.nontaxable || 0,
        total: footerData.total || 0,
        instant_saving: footerData.instant_saving || 0,
        delivery_surcharge: footerData.delivery_surcharge || 0,
        sale_tax: footerData.sale_tax || 0,
        total_due: footerData.total_due || 0
      }, { transaction: t });

      await Kt_rfsdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty || 0),
          unit_code: item.unit_code,
          uprice: Number(item.uprice || 0),
          tax1: item.tax1,
          expire_date: item.expire_date || null,
          texpire_date: item.texpire_date || null,
          instant_saving1: Number(item.instant_saving1 || 0),
          temperature1: item.temperature1 || null,
          amt: Number(item.amt || 0)
        })),
        { transaction: t }
      );

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
          kitchen_code: headerData.kitchen_code,
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

        // จัดการ lotno และ product_lotno
        const product = await Tbl_product.findOne({
          where: { product_code: item.product_code },
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (product?.lotno || 0) + 1;

        // เพิ่ม record ใน kt_product_lotno
        // await Kt_product_lotno.create({
        //   product_code: item.product_code,
        //   lotno: newLotno,
        //   unit_code: item.unit_code,
        //   qty: previousBalance + newAmount,
        //   lotdate: headerData.rdate,
        //   tlotdate: headerData.trdate,
        //   expdate: item.expire_date || null,
        //   texpdate: item.texpire_date || null,
        //   created_at: new Date(),
        //   updated_at: new Date()
        // }, { transaction: t });

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

exports.updateKt_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // ตรวจสอบว่ามี refno หรือไม่
    if (!updateData || !updateData.refno) {
      await t.rollback();
      return res.status(400).send({
        result: false,
        message: 'Missing required field: refno',
        receivedData: updateData
      });
    }

    console.log("Using refno for update:", updateData.refno);

    // First update the header record
    const updateResult = await Kt_rfsModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
        supplier_code: updateData.supplier_code,
        taxable: updateData.taxable || 0,
        nontaxable: updateData.nontaxable || 0,
        total: updateData.total || 0,
        instant_saving: updateData.instant_saving || 0,
        delivery_surcharge: updateData.delivery_surcharge || 0,
        sale_tax: updateData.sale_tax || 0,
        total_due: updateData.total_due || 0,
        user_code: updateData.user_code,
      },
      {
        where: { refno: updateData.refno }, // ต้องมีค่าที่แน่นอน
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await Kt_rfsdtModel.destroy({
      where: { refno: updateData.refno },
      transaction: t
    });

    console.log("Deleted existing details, now inserting new products:",
      updateData.productArrayData ? updateData.productArrayData.length : "No products array");

    // Insert new detail records
    if (updateData.productArrayData && updateData.productArrayData.length > 0) {
      // ตรวจสอบและแน่ใจว่าทุก product มี refno
      const productsToInsert = updateData.productArrayData.map((item, index) => ({
        ...item,
        // กำหนดค่า refno ให้ชัดเจนเพื่อความสอดคล้อง
        refno: updateData.refno,
        // Optional: เพิ่ม unique index เพื่อป้องกันการขัดแย้ง
        uniqueIndex: `${updateData.refno}_${index}`
      }));

      // การแก้ไขสำคัญ: ใช้ for...of แทน Promise.all เพื่อจัดการข้อผิดพลาดได้ดีขึ้น
      for (const product of productsToInsert) {
        try {
          await Kt_rfsdtModel.upsert(product, {
            transaction: t,
            conflictFields: ['refno', 'product_code']
          });
        } catch (error) {
          console.error('Error inserting product:', product.product_code, error);
          throw new Error(`Failed to insert product ${product.product_code}: ${error.message}`);
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
      message: error.message,
      trace: error.stack
    });
  }
};

exports.deleteKt_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Kt_rfsdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Kt_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Kt_rfsModel.destroy({
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

exports.Kt_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, kitchen_name } = req.body;

    let wheresupplier = { supplier_name: { [Op.like]: '%' } };
    if (supplier_name) {
      wheresupplier = { supplier_name: { [Op.like]: `%${supplier_name}%` } };
    }

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const kt_rfsShow = await Kt_rfsModel.findAll({
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
          where: wheresupplier,
          required: true,
        },
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        },
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
      data: kt_rfsShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_rfsAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, rdate, kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let kt_rfs_headers = await Kt_rfsModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'supplier_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Kt_rfsdtModel,
          attributes: ['product_code', 'qty', 'unit_code', 'uprice', 'tax1', 'amt', 'expire_date', 'texpire_date', 'temperature1'],
          required: false
        },
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          required: false
        },
        {
          model: Tbl_supplier, // เพิ่มการรวม Tbl_supplier
          attributes: ['supplier_code', 'supplier_name'],
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

    // Transform data to include names from relations
    if (kt_rfs_headers) {
      kt_rfs_headers = kt_rfs_headers.map(header => {
        const headerData = header.toJSON();
        return {
          ...headerData,
          kitchen_name: headerData.tbl_kitchen?.kitchen_name || '-',
          supplier_name: headerData.tbl_supplier?.supplier_name || '-', // เพิ่มการดึงชื่อ supplier
          username: headerData.user?.username || '-'
        };
      });
    }

    res.status(200).send({
      result: true,
      data: kt_rfs_headers
    });

  } catch (error) {
    console.error("Error in Kt_rfsAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_rfsByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request
    let refnoValue = req.body.refno;
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
    }

    console.log('กำลังดึงข้อมูลใบรับจากซัพพลายเออร์เลขที่:', refnoValue);

    if (!refnoValue) {
      return res.status(400).json({
        result: false,
        message: 'ต้องระบุเลขที่อ้างอิง (refno)'
      });
    }

    const kt_rfsShow = await Kt_rfsModel.findOne({
      include: [
        {
          model: Kt_rfsdtModel,
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
          model: Tbl_supplier,
          required: false
        },
        {
          model: Tbl_kitchen,
          required: false
        }
      ],
      where: { refno: refnoValue.toString() }
    });

    if (!kt_rfsShow) {
      return res.status(404).json({
        result: false,
        message: 'ไม่พบข้อมูลใบรับจากซัพพลายเออร์'
      });
    }

    res.status(200).json({ result: true, data: kt_rfsShow });
  } catch (error) {
    console.error('Error in Kt_rfsByRefno:', error);
    res.status(500).json({
      result: false,
      message: error.message || 'ไม่สามารถดึงข้อมูลใบรับจากซัพพลายเออร์ได้'
    });
  }
};

exports.countKt_rfs = async (req, res) => {
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

    const amount = await Kt_rfsModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_rfsrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const kt_rfsShow = await Kt_rfsModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: kt_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Kt_rfsrefno = async (req, res) => {
  try {
    const { month, year } = req.body;

    // Build query based on provided parameters
    let whereClause = {};

    if (month && year) {
      // If month and year are provided, find the latest refno for that specific month/year
      whereClause = {
        refno: {
          [Op.like]: `KTFS${year}${month}%`
        }
      };
    }

    const refno = await Kt_rfsModel.findOne({
      where: whereClause,
      order: [['refno', 'DESC']],
    });

    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchKt_rfsRunno = async (req, res) => {
  try {
    const kt_rfsShow = await Kt_rfsModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: kt_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.getKtRfsByRefno = async (req, res) => {
  try {
    // ดึงค่า refno จาก request body และตรวจสอบรูปแบบ
    let refnoValue = req.body.refno;

    // ตรวจสอบว่า refno เป็น object หรือไม่
    if (typeof refnoValue === 'object' && refnoValue !== null) {
      refnoValue = refnoValue.refno || '';
      console.log('Extracted refno from object:', refnoValue);
    }

    if (!refnoValue) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required (not found or empty)'
      });
    }

    // ใช้ค่า refnoValue ที่แปลงแล้วในการค้นหาข้อมูล
    const orderData = await Kt_rfsModel.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'kitchen_code', 'taxable', 'nontaxable',
        'total', 'instant_saving', 'delivery_surcharge',
        'sale_tax', 'total_due', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name'],
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
      where: { refno: refnoValue }
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
    console.error("Error in getKtRfsByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message || 'An error occurred'
    });
  }
};