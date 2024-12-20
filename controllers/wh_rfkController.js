const {
  Tbl_kitchen,
  sequelize,
  Tbl_product,
  User,
  Wh_rfk: wh_rfkModel,
  Wh_rfkdt: wh_rfkdtModel,
  Tbl_unit: unitModel,
} = require("../models/mainModel");

exports.addWh_rfk = async (req, res) => {
  try {
    const { headerData, productArrayData, footerData } = req.body;

    const t = await sequelize.transaction();

    try {
      // Create WH_RFK record
      await wh_rfkModel.create({
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

      // Create WH_RFKDT records
      await wh_rfkdtModel.bulkCreate(productArrayData, { transaction: t });

      // เพิ่มส่วนนี้เพื่อ increment lotno
      for (const item of productArrayData) {
        await Tbl_product.increment('lotno', {
          by: 1,
          where: { product_code: item.product_code },
          transaction: t
        });
      }

      await t.commit();
      res.status(200).send({ result: true });

    } catch (error) {
      await t.rollback();
      throw error;
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({ message: error.message });
  }
};

exports.updateWh_rfk = async (req, res) => {
  try {
    wh_rfkModel.update(
      {
        rdate: req.body.rdate,
        trdate: req.body.trdate,
        myear: req.body.myear,
        monthh: req.body.monthh,
        kitchen_code: req.body.kitchen_code,
        taxable: req.body.taxable,
        nontaxable: req.body.nontaxable,
        total: req.body.total,
        user_code: req.body.user_code,
      },
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.deleteWh_rfk = async (req, res) => {
  try {
    wh_rfkModel.destroy(
      { where: { refno: req.body.refno } }
    );
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkAllrdate = async (req, res) => {
  try {
    const { offset, limit, rdate1, rdate2, kitchen_name } = req.body;
    const { Op } = require("sequelize");

    let wherekitchen = { kitchen_name: { [Op.like]: '%' } };
    if (kitchen_name) {
      wherekitchen = { kitchen_name: { [Op.like]: `%${kitchen_name}%` } };
    }

    const Wh_rfkShow = await wh_rfkModel.findAll({
      include: [
        {
          model: Tbl_kitchen,
          attributes: ['kitchen_code', 'kitchen_name'],
          where: wherekitchen,
          required: true,
        },
      ],
      where: { trdate: { [Op.between]: [rdate1, rdate2] } },
    });
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkAlljoindt = async (req, res) => {
  try {
    const { offset, limit } = req.body;
    const { rdate1, rdate2 } = req.body;
    const { kitchen_code, product_code } = req.body;
    const { Op } = require("sequelize");

    let whereClause = {};

    if (rdate1 && rdate2) {
      whereClause.trdate = { [Op.between]: [rdate1, rdate2] };
    }

    if (kitchen_code && kitchen_code !== '') {
      whereClause.kitchen_code = kitchen_code;
    }

    let wh_rfk_headers = await wh_rfkModel.findAll({
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
          as: 'user',  // Make sure this matches the association alias
          attributes: ['user_code', 'username'],
          required: false
        }
      ],
      where: whereClause,
      order: [['refno', 'ASC']],
      offset: offset,
      limit: limit
    });

    if (wh_rfk_headers.length > 0) {
      const refnos = wh_rfk_headers.map(header => header.refno);

      let whereDetailClause = {
        refno: refnos
      };

      if (product_code && product_code !== '') {
        whereDetailClause = {
          refno: refnos,
          '$tbl_product.product_name$': { [Op.like]: `%${product_code}%` }
        };
      }

      const details = await wh_rfkdtModel.findAll({
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

      wh_rfk_headers = wh_rfk_headers.map(header => {
        const headerData = header.toJSON();
        headerData.wh_rfkdts = detailsByRefno[header.refno] || [];
        return headerData;
      });
    }

    res.status(200).send({
      result: true,
      data: wh_rfk_headers
    });

  } catch (error) {
    console.log("Error in Wh_rfkAlljoindt:", error);
    res.status(500).send({ message: error.message });
  }
};

exports.Wh_rfkByRefno = async (req, res) => {
  try {
    const { refno } = req.body;

    const Wh_rfkShow = await wh_rfkModel.findOne({
      include: [
        {
          model: wh_rfkdtModel,
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
    res.status(200).send({ result: true, data: Wh_rfkShow })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.countWh_rfk = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const amount = await wh_rfkModel.count({
      where: {
        refno: {
          [Op.gt]: 0,
        },
      },
    });
    res.status(200).send({ result: true, data: amount })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfkrefno = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const { refno } = req.body;

    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        refno: {
          [Op.like]: `%${refno}%`
        },
      }
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.Wh_rfkrefno = async (req, res) => {
  try {
    const refno = await wh_rfkModel.findOne({
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: refno }) // ส่งทั้ง object กลับไป
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};

exports.searchWh_rfkRunno = async (req, res) => {
  try {
    const Wh_rfkShow = await wh_rfkModel.findAll({
      where: {
        myear: req.body.myear,
        monthh: req.body.monthh
      },
      order: [['refno', 'DESC']],
    });
    res.status(200).send({ result: true, data: Wh_rfkShow });
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
  }
};