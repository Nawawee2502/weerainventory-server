const wh_posModel = require("../models/mainModel").Wh_pos;
const wh_posdtModel = require("../models/mainModel").Wh_posdt;
const unitModel = require("../models/mainModel").Tbl_unit;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models/mainModel");
const {
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Wh_stockcard,
  Wh_product_lotno
} = require("../models/mainModel");

exports.addWh_pos = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const headerData = req.body.headerData;
    console.log("headerData", headerData);
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    // Create main POS record
    await wh_posModel.create({
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

    // Create POS detail records
    await wh_posdtModel.bulkCreate(productArrayData, { transaction: t });

    // Process each product for stockcard and product lotno
    for (const item of productArrayData) {
      // Get all previous records for this product to calculate running totals
      const stockcardRecords = await Wh_stockcard.findAll({
        where: { product_code: item.product_code },
        order: [
          ['rdate', 'DESC'],
          ['refno', 'DESC']
        ],
        raw: true,
        transaction: t
      });

      // Calculate previous totals
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

      // Calculate new values
      const newAmount = Number(item.qty || 0);
      const newPrice = Number(item.uprice || 0);
      const newAmountValue = newAmount * newPrice;

      // Calculate running balances
      const previousBalance = totals.beg1 + totals.in1 + totals.upd1 - totals.out1;
      const previousBalanceAmount = totals.beg1_amt + totals.in1_amt + totals.upd1_amt - totals.out1_amt;

      // Create stockcard record with calculated values
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

      // Handle product lotno if necessary
      const product = await Tbl_product.findOne({
        where: { product_code: item.product_code },
        attributes: ['lotno'],
        transaction: t
      });

      const newLotno = (product?.lotno || 0) + 1;

      // Create product lotno record
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

      // Update product lotno
      await Tbl_product.update(
        { lotno: newLotno },
        {
          where: { product_code: item.product_code },
          transaction: t
        }
      );
    }

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Created successfully with stockcard and lotno records'
    });
  } catch (error) {
    await t.rollback();
    console.log("Error in addWh_pos:", error);
    res.status(500).send({
      result: false,
      message: error.message,
      errorDetail: error.stack
    });
  }
};

exports.updateWh_pos = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;
    console.log("Received update data:", updateData);

    // First update the header record
    const updateResult = await wh_posModel.update(
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
    await wh_posdtModel.destroy({
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
        wh_posdtModel.upsert(product, {
          transaction: t,
          // If you want to update existing records
          conflictFields: ['refno', 'product_code']
        })
      );

      await Promise.all(insertPromises);
    }

    // Update related stockcard records
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

    // Update product lotno records
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

exports.deleteWh_pos = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    // Delete detail records first
    await wh_posdtModel.destroy(
      {
        where: { refno },
        transaction: t
      }
    );

    // Delete stockcard records
    await Wh_stockcard.destroy(
      {
        where: { refno },
        transaction: t
      }
    );

    // Delete product lotno records
    await Wh_product_lotno.destroy(
      {
        where: { refno },
        transaction: t
      }
    );

    // Finally delete the main record
    const deleteResult = await wh_posModel.destroy(
      {
        where: { refno },
        transaction: t
      }
    );

    await t.commit();
    res.status(200).send({
      result: true,
      message: 'Deleted successfully',
      deletedRows: deleteResult
    });
  } catch (error) {
    await t.rollback();
    console.error("Delete Error:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_posAllrdate = async (req, res) => {
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

    const wh_posShow = await wh_posModel.findAll({
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
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: wh_posShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_posAlljoindt = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { rdate } = req.body;
    const { rdate1, rdate2 } = req.body;
    const { supplier_code, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    // สร้าง where clause สำหรับ header
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    // ถ้ามี rdate1 และ rdate2 ถึงจะเพิ่มเงื่อนไข between
    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    // ถ้ามีการเลือก supplier_code ถึงจะเพิ่มเงื่อนไข
    if (supplier_code && supplier_code !== '') {
      whereClause.supplier_code = supplier_code;
    }

    // ถ้ามีการเลือก branch_code ถึงจะเพิ่มเงื่อนไข
    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    // ดึงข้อมูลหลักก่อน
    let wh_pos_headers = await wh_posModel.findAll({
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
          model: db.User,
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

    // ดึงข้อมูลรายละเอียดแยก
    if (wh_pos_headers.length > 0) {
      const refnos = wh_pos_headers.map(header => header.refno);

      // สร้าง where clause สำหรับ details
      let whereDetailClause = {
        refno: refnos
      };

      // ถ้ามีการเลือก product_code ถึงจะเพิ่มเงื่อนไข
      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }  // เปลี่ยนเป็นค้นหาจาก product_name แทน
        };
      } else {
        whereDetailClause = {
          refno: refnos
        };
      }

      const details = await wh_posdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true  // เปลี่ยนเป็น true เพื่อให้ join แบบ inner
          },
          {
            model: unitModel,
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

      // จัดกลุ่มข้อมูลรายละเอียดตาม refno
      const detailsByRefno = {};
      details.forEach(detail => {
        if (!detailsByRefno[detail.refno]) {
          detailsByRefno[detail.refno] = [];
        }
        detailsByRefno[detail.refno].push(detail.toJSON());
      });

      // Create lookup for stockcard data
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

      // รวมข้อมูลเข้าด้วยกัน
      wh_pos_headers = wh_pos_headers.map(header => {
        const headerData = header.toJSON();
        const details = detailsByRefno[header.refno] || [];

        // Add stockcard data to details
        headerData.wh_posdts = details.map(detail => {
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

    console.log('Query Result:', JSON.stringify(wh_pos_headers, null, 2));

    res.status(200).send({
      result: true,
      data: wh_pos_headers
    });

  } catch (error) {
    console.log("Error in Wh_posAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

// *********************แก้ไขใหม่********************* 
exports.Wh_posByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_posShow = await wh_posModel.findOne({
      include: [
        {
          model: wh_posdtModel,
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
          // as: "postoposdt",
          // required: true,
        },
      ],
      where: { refno: refno }
      // offset:offset,limit:limit 
    });
    res.status(200).send({ result: true, data: wh_posShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_pos = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    // เพิ่มเงื่อนไขการนับตามวันที่ที่เลือก
    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await wh_posModel.count({
      where: whereClause
    });

    res.status(200).send({
      result: true,
      data: amount
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
  }
};

exports.searchWh_posrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Wh_posShow = await wh_posModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_posShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.refno = async (req, res) => {
  try {
    const refno = await wh_posModel.findOne({
      order: [['refno', 'DESC']],
    });
    console.log("lastrefno", refno);
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchWh_posRunno = async (req, res) => {
  try {
    const { Op } = require("sequelize");

    const Wh_posShow = await wh_posModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_posShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.getWhPosByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    if (!refno) {
      return res.status(400).send({
        result: false,
        message: 'Reference number is required'
      });
    }

    // Fetch the specific record by refno
    const orderData = await wh_posModel.findOne({
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
    console.error("Error in getPosByRefno:", error);
    res.status(500).send({
      result: false,
      message: error.message
    });
  }
};