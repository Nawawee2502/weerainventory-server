const {
  Kt_rfw: Kt_rfwModel,
  Kt_rfwdt: Kt_rfwdtModel,
  Kt_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_kitchen,
  User,
  Tbl_unit: unitModel
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
      await Kt_rfwModel.create({
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

      for (const item of productArrayData) {
        const stockcardRecords = await Kt_stockcard.findAll({
          where: { product_code: item.product_code },
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

        const product = await Tbl_product.findOne({
          where: { product_code: item.product_code },
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (product?.lotno || 0) + 1;

        await Kt_product_lotno.create({
          product_code: item.product_code,
          lotno: newLotno,
          unit_code: item.unit_code,
          qty: previousBalance + qty,
          lotdate: headerData.rdate,
          tlotdate: headerData.trdate,
          expdate: item.expire_date || null,
          texpdate: item.texpire_date || null,
          created_at: new Date(),
          updated_at: new Date()
        }, { transaction: t });

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

exports.updateKt_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;

    // Get all detail records to calculate new balances
    const detailRecords = await Kt_rfwdtModel.findAll({
      where: { refno: updateData.refno },
      transaction: t
    });

    // Calculate new balance values
    const balance = detailRecords.reduce((sum, record) => sum - Number(record.qty || 0), 0); // Subtract for waste
    const balance_amount = detailRecords.reduce((sum, record) => {
      const qty = Number(record.qty || 0);
      const uprice = Number(record.uprice || 0);
      return sum - (qty * uprice); // Subtract for waste
    }, 0);

    // Update main record
    const updateResult = await Kt_rfwModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        kitchen_code: updateData.kitchen_code,
        taxable: updateData.taxable,
        nontaxable: updateData.nontaxable,
        total: updateData.total,
        user_code: updateData.user_code,
        balance: balance,
        balance_amount: balance_amount
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    // Update stockcard records
    await Kt_stockcard.update(
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
    await Kt_product_lotno.update(
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

    let kt_rfw_headers = await Kt_rfwModel.findAll({
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

    if (kt_rfw_headers.length > 0) {
      const refnos = kt_rfw_headers.map(header => header.refno);

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
      const details = await Kt_rfwdtModel.findAll({
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

      // Get stockcard information for balance and balance_amount
      const stockcardInfo = await Kt_stockcard.findAll({
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
      kt_rfw_headers = kt_rfw_headers.map(header => {
        const headerData = header.toJSON();
        const details = detailsByRefno[header.refno] || [];

        // Add balance info to each detail record
        headerData.kt_rfwdts = details.map(detail => {
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
      data: kt_rfw_headers
    });

  } catch (error) {
    console.error("Error in Kt_rfwAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Kt_rfwByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

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
    res.status(200).send({ result: true, data: kt_rfwShow });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error });
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
    const refno = await Kt_rfwModel.findOne({
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