const { 
  User,
  Tbl_kitchen, 
  sequelize, 
  Tbl_product, 
  Tbl_unit: unitModel, 
  Wh_dpk: wh_dpkModel, 
  Wh_dpkdt: wh_dpkdtModel 
} = require("../models/mainModel");

exports.addWh_dpk = async (req, res) => {
  try {
    const headerData = req.body.headerData;
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    // เริ่ม transaction
    const t = await sequelize.transaction();

    try {
      // สร้าง WH_DPK record
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

      // สร้าง WH_DPKDT records
      await wh_dpkdtModel.bulkCreate(productArrayData, { transaction: t });

      // ลด lotno ลง 1 สำหรับแต่ละ product
      for (const item of productArrayData) {
        await Tbl_product.decrement('lotno', {
          by: 1,
          where: { product_code: item.product_code },
          transaction: t
        });
      }

      // Commit transaction
      await t.commit();
      res.status(200).send({ result: true });

    } catch (error) {
      // Rollback ถ้าเกิด error
      await t.rollback();
      console.log('Transaction Error:', error);
      throw error;
    }

  } catch (error) {
    console.log('Server Error:', error);
    res.status(500).send({ message: error.message });
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