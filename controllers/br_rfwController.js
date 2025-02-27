const {
  Tbl_supplier,
  sequelize,
  Tbl_product,
  Tbl_branch,
  User,
  Br_rfw: Br_rfwModel,
  Br_rfwdt: Br_rfwdtModel,
  Tbl_unit: unitModel,
  Br_stockcard
} = require("../models/mainModel");

exports.addBr_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    if (!headerData.refno || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // สร้าง header
      await Br_rfwModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        supplier_code: headerData.supplier_code,  // มี supplier_code แล้ว
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: footerData.taxable || 0,
        nontaxable: footerData.nontaxable || 0,
        total: footerData.total || 0,
      }, { transaction: t });

      // สร้าง details
      await Br_rfwdtModel.bulkCreate(
        productArrayData.map(item => ({
          refno: headerData.refno,
          product_code: item.product_code,
          qty: Number(item.qty),
          unit_code: item.unit_code,
          uprice: Number(item.uprice),
          tax1: item.tax1,
          amt: Number(item.amt),
          // temperature1: item.temperature1 || null
        })),
        { transaction: t }
      );

      // อัพเดท stock card
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

        const qty = Number(item.qty || 0);
        const uprice = Number(item.uprice || 0);
        const amount = qty * uprice;

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
          in1: 0,
          out1: qty,
          upd1: 0,
          uprice: uprice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: amount,
          upd1_amt: 0,
          balance: previousBalance - qty,
          balance_amount: previousBalanceAmount - amount
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

exports.updateBr_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const updateData = req.body;

    const detailRecords = await Br_rfwdtModel.findAll({
      where: { refno: updateData.refno },
      transaction: t
    });

    const balance = detailRecords.reduce((sum, record) => sum - Number(record.qty || 0), 0); // Subtract for waste
    const balance_amount = detailRecords.reduce((sum, record) => {
      const qty = Number(record.qty || 0);
      const uprice = Number(record.uprice || 0);
      return sum - (qty * uprice); // Subtract for waste
    }, 0);

    const updateResult = await Br_rfwModel.update(
      {
        rdate: updateData.rdate,
        trdate: updateData.trdate,
        myear: updateData.myear,
        monthh: updateData.monthh,
        branch_code: updateData.branch_code,
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

exports.deleteBr_rfw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { refno } = req.body;

    await Br_rfwdtModel.destroy({
      where: { refno },
      transaction: t
    });

    await Br_stockcard.destroy({
      where: { refno },
      transaction: t
    });

    const deleteResult = await Br_rfwModel.destroy({
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

exports.Br_rfwAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;
    const { Op } = require("sequelize");

    let wherebranch = { branch_name: { [Op.like]: '%' } };
    if (branch_name) {
      wherebranch = { branch_name: { [Op.like]: `%${branch_name}%` } };
    }

    const br_rfwShow = await Br_rfwModel.findAll({
      include: [
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
      data: br_rfwShow
    });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfwAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, rdate, branch_code, product_code, supplier_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    if (supplier_code && supplier_code !== '') {
      whereClause.supplier_code = supplier_code;
    }

    let br_rfw_headers = await Br_rfwModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'supplier_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          required: false
        },
        {
          model: Tbl_supplier,  // เพิ่ม supplier
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

    // เพิ่มการตรวจสอบข้อมูล
    if (br_rfw_headers) {
      br_rfw_headers = br_rfw_headers.map(header => {
        const headerData = header.toJSON();
        return {
          ...headerData,
          branch_name: headerData.tbl_branch?.branch_name || '-',
          supplier_name: headerData.tbl_supplier?.supplier_name || '-',
          username: headerData.user?.username || '-'
        };
      });
    }

    res.status(200).send({
      result: true,
      data: br_rfw_headers
    });

  } catch (error) {
    console.error("Error in Br_rfwAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Br_rfwByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const br_rfwShow = await Br_rfwModel.findOne({
      include: [
        {
          model: Br_rfwdtModel,
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
    res.status(200).send({ result: true, data: br_rfwShow });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.countBr_rfw = async (req, res) => {
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

    const amount = await Br_rfwModel.count({
      where: whereClause
    });

    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfwrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const br_rfwShow = await Br_rfwModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: br_rfwShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.Br_rfwrefno = async (req, res) => {
  try {
    const refno = await Br_rfwModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};

exports.searchBr_rfwRunno = async (req, res) => {
  try {
    const br_rfwShow = await Br_rfwModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: br_rfwShow });

  } catch (error) {
    console.error(error);
    res.status(500).send({ message: error });
  }
};