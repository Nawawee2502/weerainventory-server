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
          in1: qty,
          out1: 0,
          upd1: 0,
          uprice: uprice,
          beg1_amt: 0,
          in1_amt: amount,
          out1_amt: 0,
          upd1_amt: 0,
          balance: previousBalance + qty,
          balance_amount: previousBalanceAmount + amount
        }, { transaction: t });

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
      attributes: {
        include: [
          'balance',
          'balance_amount'
        ]
      }
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

    // Added include for Kt_rfwdt model to get temperature1
    let kt_rfw_headers = await Kt_rfwModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'kitchen_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Kt_rfwdtModel,
          attributes: ['product_code', 'qty', 'unit_code', 'uprice', 'tax1', 'amt', 'expire_date', 'texpire_date', 'temperature1'],
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
      order: [['refno', 'ASC']],
      offset: offset,
      limit: limit
    });

    // Transform data to include names from relations
    if (kt_rfw_headers) {
      kt_rfw_headers = kt_rfw_headers.map(header => {
        const headerData = header.toJSON();
        return {
          ...headerData,
          kitchen_name: headerData.tbl_kitchen?.kitchen_name || '-',
          username: headerData.user?.username || '-'
        };
      });
    }

    res.status(200).send({
      result: true,
      data: kt_rfw_headers
    });

  } catch (error) {
    console.error("Error in Kt_rfwAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

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