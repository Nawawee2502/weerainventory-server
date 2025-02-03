const {
  Br_rfs: br_rfsModel,
  Br_rfsdt: br_rfsdtModel,
  Br_stockcard,
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  Tbl_unit,
  User,
  Unit
} = require("../models/mainModel");
const { Op } = require("sequelize");

exports.addBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.supplier_code || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      await br_rfsModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
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

      await br_rfsdtModel.bulkCreate(
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

exports.updateBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;

    const detailRecords = await br_rfsdtModel.findAll({
      where: { refno: updateData.refno },
      transaction: t
    });

    const balance = detailRecords.reduce((sum, record) => sum + Number(record.qty || 0), 0);
    const balance_amount = detailRecords.reduce((sum, record) => {
      const qty = Number(record.qty || 0);
      const uprice = Number(record.uprice || 0);
      return sum + (qty * uprice);
    }, 0);

    const updateResult = await br_rfsModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        branch_code: updateData.branch_code,
        supplier_code: updateData.supplier_code,
        taxable: updateData.taxable || 0,
        nontaxable: updateData.nontaxable || 0,
        total: updateData.total || 0,
        instant_saving: updateData.instant_saving || 0,
        delivery_surcharge: updateData.delivery_surcharge || 0,
        sale_tax: updateData.sale_tax || 0,
        total_due: updateData.total_due || 0,
        user_code: updateData.user_code,
        balance: balance,
        balance_amount: balance_amount
      },
      {
        where: { refno: updateData.refno },
        transaction: t
      }
    );

    await Br_stockcard.update(
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

exports.deleteBr_rfs = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await br_rfsdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await br_rfsModel.destroy({
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

exports.Br_rfsAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, supplier_name, branch_name } = req.body;

    let wheresupplier = { supplier_name: { [Op.like]: '%' } };
    if (supplier_name) {
      wheresupplier = { supplier_name: { [Op.like]: `%${supplier_name}%` } };
    }

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_rfsShow = await br_rfsModel.findAll({
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
      data: br_rfsShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfsAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, rdate, supplier_code, branch_code, product_code } = req.body;

    let whereClause = {};
    if (rdate) whereClause.rdate = rdate;
    if (rdate1 && rdate2) whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    if (supplier_code) whereClause.supplier_code = supplier_code;
    if (branch_code) whereClause.branch_code = branch_code;

    let productWhere = {};
    if (product_code) {
      productWhere = {
        product_name: { [Op.like]: `%${product_code}%` }
      };
    }

    const br_rfs_headers = await br_rfsModel.findAll({
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
        },
        {
          model: br_rfsdtModel,
          required: false,
          include: [
            {
              model: Tbl_product,
              attributes: ['product_code', 'product_name'],
              required: false,
              where: productWhere
            },
            {
              model: Tbl_unit,
              attributes: ['unit_code', 'unit_name'],
              required: false
            }
          ]
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset,
      limit
    });

    res.status(200).send({
      result: true,
      data: br_rfs_headers
    });

  } catch (error) {
    console.error("Error in Br_rfsAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfsByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfsShow = await br_rfsModel.findOne({
      include: [
        {
          model: br_rfsdtModel,
          include: [{
            model: Tbl_product,
            include: [
              {
                model: Unit,
                as: 'productUnit1',
                required: true,
              },
              {
                model: Unit,
                as: 'productUnit2',
                required: true,
              },
            ],
          }],
        },
      ],
      where: { refno: refno }
    });
    res.status(200).send({ result: true, data: br_rfsShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.countBr_rfs = async (req, res) => {
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

    const amount = await br_rfsModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfsrefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfsShow = await br_rfsModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: br_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Br_rfsrefno = async (req, res) => {
  try {
    const refno = await br_rfsModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfsRunno = async (req, res) => {
  try {
    const br_rfsShow = await br_rfsModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: br_rfsShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};