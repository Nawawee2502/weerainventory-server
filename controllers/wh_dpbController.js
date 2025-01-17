const {
  User,
  Tbl_branch,
  sequelize,
  Tbl_product,
  Tbl_unit: unitModel,
  Wh_dpb: wh_dpbModel,
  Wh_dpbdt: wh_dpbdtModel,
  Wh_stockcard,
  Wh_product_lotno
} = require("../models/mainModel");

// สำหรับ addWh_dpb
exports.addWh_dpb = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    console.log('Received Data:', {
      headerData,
      productArrayData,
      footerData
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!headerData.refno || !headerData.branch_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. สร้าง WH_DPB record
      await wh_dpbModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        branch_code: headerData.branch_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      // 2. สร้าง detail records
      await wh_dpbdtModel.bulkCreate(productArrayData, { transaction: t });

      // 3. สร้าง stockcard records และอัพเดท lotno
      for (const item of productArrayData) {
        // หา records ทั้งหมดของสินค้านี้เพื่อคำนวณยอดรวม
        const stockcardRecords = await Wh_stockcard.findAll({
          where: { product_code: item.product_code },
          order: [['rdate', 'DESC'], ['refno', 'DESC']],
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

        // คำนวณค่าใหม่สำหรับการเบิกจ่าย
        const outAmount = Number(item.qty || 0);
        const outPrice = Number(item.uprice || 0);
        const outAmountValue = outAmount * outPrice;

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

        // หา lotno ล่าสุดจาก wh_product_lotno
        const lastLotno = await Wh_product_lotno.findOne({
          where: { product_code: item.product_code },
          order: [['lotno', 'DESC']],
          attributes: ['lotno'],
          transaction: t
        });

        const newLotno = (lastLotno?.lotno || 0) + 1;

        // อัพเดท lotno ในตาราง product
        await Tbl_product.update(
          { lotno: newLotno },
          {
            where: { product_code: item.product_code },
            transaction: t
          }
        );

        // สร้าง product lotno record ใหม่
        await Wh_product_lotno.create({
          product_code: item.product_code,
          lotno: newLotno,
          unit_code: item.unit_code,
          qty: previousBalance,
          uprice: outPrice,
          refno: headerData.refno,
          qty_use: outAmount,
          rdate: headerData.rdate
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

exports.updateWh_dpb = async (req, res) => {
  try {
    await wh_dpbModel.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        branch_code: req.body.branch_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code,
      },
      { where: { refno: req.body.refno } }
    );

    res.status(200).send({ result: true });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.deleteWh_dpb = async (req, res) => {
  try {
    await wh_dpbModel.destroy({ where: { refno: req.body.refno } });
    res.status(200).send({ result: true });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_name } = req.body;
    const { Op } = require("sequelize");

    const wherebranch = { branch_name: { [Op.like]: '%', } };
    if (branch_name) wherebranch = { $like: '%' + branch_name + '%' };

    const wh_dpbShow = await wh_dpbModel.findAll({
      include: [
        {
          model: Tbl_branch,
          attributes: ['branch_code', 'branch_name'],
          where: wherebranch,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
      offset,
      limit,
    });

    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, branch_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (branch_code && branch_code !== '') {
      whereClause.branch_code = branch_code;
    }

    let wh_dpb_headers = await wh_dpbModel.findAll({
      attributes: [
        'refno', 'rdate', 'trdate', 'myear', 'monthh',
        'branch_code', 'taxable', 'nontaxable',
        'total', 'user_code', 'created_at'
      ],
      include: [
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
      offset,
      limit
    });

    if (wh_dpb_headers.length > 0) {
      const refnos = wh_dpb_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await wh_dpbdtModel.findAll({
        where: whereDetailClause,
        include: [
          {
            model: Tbl_product,
            attributes: ['product_code', 'product_name'],
            required: true
          },
          {
            model: unitModel,  // เปลี่ยนจาก as: 'productUnit1' เป็นการใช้ model โดยตรง
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

      wh_dpb_headers = wh_dpb_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_dpbdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_dpb_headers
    });
  } catch (error) {
    console.error("Error in Wh_dpbAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_dpbByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const wh_dpbShow = await wh_dpbModel.findOne({
      include: [
        {
          model: wh_dpbdtModel,
          include: [{
            model: Tbl_product,
            include: [
              { model: Tbl_unit, as: 'productUnit1', required: true },
              { model: Tbl_unit, as: 'productUnit2', required: true },
            ],
          }],
        },
      ],
      where: { refno },
    });

    res.status(200).send({ result: true, data: wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.countWh_dpb = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_dpbModel.count({
      where: {
        refno: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.searchWh_dpbrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });

    res.status(200).send({ result: true, data: Wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
};

exports.Wh_dpbrefno = async (req, res) => {
  try {
    const refno = await wh_dpbModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno });
  } catch (error) {
    res.status(500).send({ message: error });
  }
}

exports.searchWh_dpbRunno = async (req, res) => {
  try {
    const Wh_dpbShow = await wh_dpbModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_dpbShow });
  } catch (error) {
    res.status(500).send({ message: error });
  }
}