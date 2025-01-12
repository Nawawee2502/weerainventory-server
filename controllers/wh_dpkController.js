const {
  User,
  Tbl_kitchen,
  sequelize,
  Tbl_product,
  Tbl_unit: unitModel,
  Wh_dpk: wh_dpkModel,
  Wh_dpkdt: wh_dpkdtModel,
  Wh_stockcard,
  Wh_product_lotno
} = require("../models/mainModel");

exports.addWh_dpk = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { headerData, productArrayData, footerData } = req.body;

    console.log('Received Data:', {
      headerData,
      productArrayData,
      footerData
    });

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!headerData.refno || !headerData.kitchen_code) {
      throw new Error('Missing required fields in header data');
    }

    if (!Array.isArray(productArrayData) || productArrayData.length === 0) {
      throw new Error('Product data is required');
    }

    try {
      // 1. สร้าง WH_DPK record
      await wh_dpkModel.create({
        refno: headerData.refno,
        rdate: headerData.rdate,
        kitchen_code: headerData.kitchen_code,
        trdate: headerData.trdate,
        monthh: headerData.monthh,
        myear: headerData.myear,
        user_code: headerData.user_code,
        taxable: headerData.taxable,
        nontaxable: headerData.nontaxable,
        total: footerData.total
      }, { transaction: t });

      // 2. สร้าง detail records
      await wh_dpkdtModel.bulkCreate(productArrayData, { transaction: t });

      // 3. สร้าง stockcard records และอัพเดท lotno และ product_lotno
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
          out1: outAmount, // บันทึกในฝั่ง out
          upd1: 0,
          uprice: outPrice,
          beg1_amt: 0,
          in1_amt: 0,
          out1_amt: outAmountValue, // บันทึกมูลค่าในฝั่ง out
          upd1_amt: 0,
          balance: previousBalance - outAmount, // ลบจาก balance เดิม
          balance_amount: previousBalanceAmount - outAmountValue // ลบจาก balance_amount เดิม
        }, { transaction: t });

        // ลด lotno ลง 1
        await Tbl_product.decrement('lotno', {
          by: 1,
          where: { product_code: item.product_code },
          transaction: t
        });

        // อัพเดท qty_use ใน wh_product_lotno
        await Wh_product_lotno.update(
          {
            qty_use: outAmount // เพิ่ม qty_use ตามจำนวนที่เบิก
          },
          {
            where: {
              product_code: item.product_code,
              refno: item.refno
            },
            transaction: t
          }
        );

        // ถ้าไม่มี record ใน wh_product_lotno ให้สร้างใหม่
        const existingLotno = await Wh_product_lotno.findOne({
          where: {
            product_code: item.product_code,
            refno: headerData.refno
          },
          transaction: t
        });

        if (!existingLotno) {
          await Wh_product_lotno.create({
            product_code: item.product_code,
            lotno: 0, // หรือค่าที่เหมาะสม
            unit_code: item.unit_code,
            qty: previousBalance - outAmount,
            uprice: outPrice,
            refno: headerData.refno,
            qty_use: outAmount,
            rdate: headerData.rdate
          }, { transaction: t });
        }
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

exports.Wh_dpkAlljoindt = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let wh_dpk_headers = await wh_dpkModel.findAll({
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
      offset,
      limit
    });

    if (wh_dpk_headers.length > 0) {
      const refnos = wh_dpk_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause['$tbl_product.product_name$'] = {
          [Op.like]: `%${product_code}%`
        };
      }

      const details = await wh_dpkdtModel.findAll({
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

      wh_dpk_headers = wh_dpk_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_dpkdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_dpk_headers
    });
  } catch (error) {
    console.error("Error in Wh_dpkAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.countWh_dpk = async (req, res) => {
  try {
    const { rdate } = req.body;
    let whereClause = {};

    if (rdate) {
      whereClause.rdate = rdate;
    }

    const amount = await wh_dpkModel.count({
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

exports.updateWh_dpk = async (req, res) => {
  try {
    wh_dpkModel.update(
      {
        rdate: req.body.rdate, //19/10/2024
        trdate: req.body.trdate, //20241019
        myear: req.body.myear, // 2024
        monthh: req.body.monthh, //10
        kitchen_code: req.body.kitchen_code_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code
      },
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};


exports.deleteWh_dpk = async (req, res) => {
  try {
    wh_dpkModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }

};

exports.Wh_dpkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    const wherekitchen = { kitchen_name: { [Op.like]: '%', } };
    if (kitchen_name)
      wherekitchen = { $like: '%' + kitchen_name + '%' };

    const Wh_dpkShow = await wh_dpkModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          // where: { supplier_name: {[Op.like]: '%'+(supplier_name)+'%',}},
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Wh_dpkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

// *********************แก้ไขใหม่********************* 
exports.Wh_dpkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Wh_dpkShow = await wh_dpkModel.findOne({
      include: [
        {
          model: wh_dpkdtModel,
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
    res.status(200).send({ result: true, data: Wh_dpkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_dpkrefno = async (req, res) => {
  try {
    // console.log( req.body.type_productname);
    const { Op } = require("sequelize");
    const { refno } = await req.body;
    // console.log((typeproduct_name));

    const Wh_dpkShow = await wh_dpkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_dpkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_dpkrefno = async (req, res) => {
  try {
    const refno = await wh_dpkModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
}

exports.searchWh_dpkRunno = async (req, res) => {
  try {
    const Wh_dpkShow = await wh_dpkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_dpkShow });

  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};