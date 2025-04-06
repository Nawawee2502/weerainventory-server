const {
  Wh_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Wh_rfs,
  Wh_rfsdt,
  Tbl_unit,
  Wh_product_lotno
} = require("../models/mainModel");

exports.addWh_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    console.log('Received Data:', {
      headerData,
      productArrayData,
      footerData
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!headerData.refno || !headerData.supplier_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. สร้าง WH_RFS record
      await Wh_rfs.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        supplier_code: headerData.supplier_code,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable,
        nontaxable: footerData.nontaxable,
        total: footerData.total,
        instant_saving: footerData.instant_saving,
        delivery_surcharge: footerData.delivery_surcharge,
        sale_tax: footerData.sale_tax,
        total_due: footerData.total_due
      }, { transaction: t });

      // 2. สร้าง detail records
      await Wh_rfsdt.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty),
          unit_code: item.unit_code,
          uprice: Number(item.uprice),
          tax1: item.tax1,
          expire_date: item.expire_date,
          texpire_date: item.texpire_date,
          instant_saving1: Number(item.instant_saving1),
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
          qty: previousBalance + newAmount,
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

exports.updateWh_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await Wh_rfs.update(
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
        instant_saving: updateData.instant_saving || 0,
        delivery_surcharge: updateData.delivery_surcharge || 0,
        sale_tax: updateData.sale_tax || 0,
        total_due: updateData.total_due || 0,
        user_code: updateData.user_code,
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Delete existing detail records so we can insert fresh ones
    await Wh_rfsdt.destroy({
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
        Wh_rfsdt.upsert(product, {
          transaction: t,
          // If you want to update existing records
          conflictFields: ['refno', 'product_code']
        })
      );

      await Promise.all(insertPromises);
    }

    // Update related stockcard records if needed
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

    // Update product lotno records if needed
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

exports.deleteWh_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    // Delete detail records first
    await Wh_rfsdt.destroy({
      where: { refno },
      transaction: t
    });

    // Delete stockcard records
    await Wh_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    // Delete product lotno records
    await Wh_product_lotno.destroy({
      where: { refno },
      transaction: t
    });

    // Finally delete the main record
    const deleteResult = await Wh_rfs.destroy({
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

exports.Wh_rfsAllrdate = async (req, res) => {
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

    const wh_rfsShow = await Wh_rfs.findAll({
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
      data: wh_rfsShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_rfsAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, rdate, supplier_code, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (supplier_code && supplier_code !== '') {
      whereClause.supplier_code = supplier_code;
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    let wh_rfs_headers = await Wh_rfs.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
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
      offset: offset,
      limit: limit
    });

    if (wh_rfs_headers.length > 0) {
      const refnos = wh_rfs_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }
        };
      }

      // Get details with product and unit information
      const details = await Wh_rfsdt.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: Tbl_unit,
            attributes: ['unit_code', 'unit_name'],
            required: false
          }
        ]
      });

      // Get stockcard information for balance and balance_amount
      const stockcardInfo = await Wh_stockcard.findAll({
        where: { refno: refnos },
        attributes: ['refno', 'product_code', 'balance', 'balance_amount']
      });

      // Create lookup objects for quick access
      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail.toJSON());
      });

      const stockcardByRefnoAndProduct = {};
      stockcardInfo.forEach(sc => {
        if (!stockcardByRefnoAndProduct[sc.refno]) {
          stockcardByRefnoAndProduct[sc.refno] = {};
        }
        stockcardByRefnoAndProduct[sc.refno][sc.product_code] = {
          balance: sc.balance,
          balance_amount: sc.balance_amount
        };
      });

      // Combine all information
      wh_rfs_headers = wh_rfs_headers.map(header => {
        const headerData = header.toJSON();
        const details = detailsByRefno[header.refno] || [];

        // Add balance info to each detail record
        headerData.wh_rfsdts = details.map(detail => {
          const stockcardData = stockcardByRefnoAndProduct[header.refno]?.[detail.product_code] || {
            balance: 0,
            balance_amount: 0
          };
          return {
            ...detail,
            balance: stockcardData.balance,
            balance_amount: stockcardData.balance_amount
          };
        });

        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_rfs_headers
    });

  } catch (error) {
    console.error("Error in Wh_rfsAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_rfsByRefno = async (req, res) => {
  try {
    const refno = req.params.refno || req.body.refno;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // ดึงข้อมูลหลัก (header)
    const wh_rfsShow = await Wh_rfs.findOne({
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name', 'addr1', 'addr2', 'tel1'],
          required: false,
        },
        {
          model: Tbl_supplier,
          attributes: ['supplier_code', 'supplier_name', 'addr1', 'addr2', 'tel1'],
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_code', 'username'],
          required: false,
        }
      ],
      where: { refno: refno }
    });

    if (!wh_rfsShow) {
      return res.status(404).send({
        result: false,
        message: 'Receipt not found'
      });
    }

    // ดึงข้อมูลรายละเอียด (details) แยกต่างหาก พร้อมข้อมูล product และ unit
    const details = await Wh_rfsdt.findAll({
      include: [
        {
          model: Tbl_product,
          include: [
            {
              model: Tbl_unit,
              as: 'productUnit1',
              required: false,
            },
            {
              model: Tbl_unit,
              as: 'productUnit2',
              required: false,
            }
          ],
          required: false,
        },
        {
          model: Tbl_unit,
          required: false,
        }
      ],
      where: { refno: refno }
    });

    console.log("Details found:", details.length);

    // รวมข้อมูลเข้าด้วยกัน
    const response = wh_rfsShow.toJSON();
    response.wh_rfsdts = details;

    res.status(200).send({
      result: true,
      data: response
    });
  } catch (error) {
    console.error("Error in Wh_rfsByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};

exports.countWh_rfs = async (req, res) => {
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

    const amount = await Wh_rfs.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.searchWh_rfsrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_rfsShow = await Wh_rfs.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfsrefno = async (req, res) => {
  try {
    const refno = await Wh_rfs.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfsRunno = async (req, res) => {
  try {
    const Wh_rfsShow = await Wh_rfs.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_rfsShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getWhRfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await Wh_rfs.findOne({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'supplier_code', 'branch_code', 'taxable', 'nontaxable',
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
    console.error("Error in getRfsByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};