const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const {
  User,
  Tbl_branch,
  Tbl_product,
  Tbl_unit: unitModel,
  Wh_dpb: wh_dpbModel,
  Wh_dpbdt: wh_dpbdtModel
} = require("../models/mainModel");

exports.addWh_dpb = async (req, res) => {
  try {
    const headerData = req.body.headerData;
    console.log("headerData", headerData)
    const productArrayData = req.body.productArrayData;
    const footerData = req.body.footerData;

    wh_dpbModel.create({
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
    })
      .then(() => {
        console.log("THEN")
        console.log(productArrayData)
        wh_dpbdtModel.bulkCreate(productArrayData)
      })
    res.status(200).send({ result: true })
  } catch (error) {
    console.log(error)
    res.status(500).send({ message: error })
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